const BasePlugin = require('../base');
const AlibabaApiClient = require('./api-client');
const AlibabaOAuth = require('./oauth');
const TokenManager = require('./token-manager');
const OAuthCallbackServer = require('./oauth-server');
const OAuthUI = require('./auth-ui');
const path = require('path');

/**
 * 阿里巴巴国际站插件
 * Alibaba International Plugin
 *
 * 支持四种数据获取模式：
 * 1. Mock 模式 - 使用模拟数据（默认，推荐用于开发测试）
 * 2. Web Scraping 模式 - 通过网页抓取获取数据（实验性）
 * 3. API 模式 - 使用 API 调用（需要 API 凭证）
 * 4. OAuth 模式 - 使用 OAuth 授权后的真实 API（推荐用于生产）
 */
class AlibabaIntlPlugin extends BasePlugin {
  constructor(config) {
    super(config);
    this.name = 'alibaba-intl';
    this.version = '3.0.0';
    this.description = '阿里巴巴国际站供应商和产品查询插件（支持 OAuth 授权）';
    this.author = 'OpenWorkBuddy';
    this.capabilities = [
      'searchSuppliers',
      'getSupplierInfo',
      'searchProducts',
      'comparePrice',
      'authorize',
      'getAuthStatus',
      'revokeAuth'
    ];

    // 数据获取模式：'mock' | 'scraping' | 'api' | 'oauth'
    this.mode = config.mode || 'mock';

    // OAuth 配置
    this.enableOAuth = config.enableOAuth !== false;
    this.oauthConfig = {
      clientId: config.oauthClientId || config.clientId || '',
      clientSecret: config.oauthClientSecret || config.clientSecret || '',
      appScene: config.oauthAppScene || 'openworkbuddy',
      authUrl: config.oauthAuthUrl || 'https://login.alibaba.com/v2/common_second_part_login.htm',
      callbackGateway: config.oauthCallbackGateway || 'http://localhost:3800/api/plugins/alibaba-international/auth/callback',
      tokenUrl: config.oauthTokenUrl || 'https://gw.open.1688.com/openapi/param2/1/com.alibaba.account/token.oauth2.getToken',
      localCallbackPort: config.oauthCallbackPort || 3000,
      usePKCE: config.oauthUsePKCE !== false
    };

    // API 配置（向后兼容）
    this.apiKey = config.apiKey || '';
    this.apiSecret = config.apiSecret || '';
    this.baseUrl = config.baseUrl || 'https://www.alibaba.com';
    this.timeout = config.timeout || 30000;
    this.enableCache = config.enableCache !== false;
    this.cacheDuration = config.cacheDuration || 3600000;

    // 向后兼容旧配置
    if (config.useMockData === false && this.mode === 'mock') {
      this.mode = 'api';
    }

    // 初始化缓存
    this.cache = new Map();

    // 初始化 OAuth 组件
    this.oauth = null;
    this.tokenManager = null;
    this.callbackServer = null;
    this.oauthUI = null;

    // 初始化 API 客户端
    this.apiClient = null;
  }

  async onInit() {
    console.log('[AlibabaIntl] Initializing plugin...');
    console.log(`[AlibabaIntl] Mode: ${this.mode}`);
    console.log(`[AlibabaIntl] OAuth Enabled: ${this.enableOAuth}`);

    // 初始化 OAuth 组件（如果启用）
    if (this.enableOAuth) {
      this.oauth = new AlibabaOAuth(this.oauthConfig);

      this.tokenManager = new TokenManager({
        storageDir: path.join(__dirname, '.auth'),
        oauth: this.oauth,
        autoRefresh: true
      });

      this.callbackServer = new OAuthCallbackServer({
        port: this.oauthConfig.localCallbackPort,
        path: '/callback',
        timeout: 300000
      });

      this.oauthUI = new OAuthUI({
        oauth: this.oauth,
        tokenManager: this.tokenManager,
        callbackServer: this.callbackServer
      });

      // 检查是否已授权
      const isAuthorized = await this.tokenManager.isAuthorized();
      if (isAuthorized) {
        console.log('[AlibabaIntl] ✓ OAuth authorized');

        // 如果模式是 oauth 或未明确指定，使用 OAuth 模式
        if (this.mode === 'oauth' || (this.mode === 'mock' && isAuthorized)) {
          this.mode = 'oauth';
        }
      } else {
        console.log('[AlibabaIntl] ✗ OAuth not authorized');
        console.log('[AlibabaIntl] Call authorize() capability to start OAuth flow');
      }
    }

    // 根据模式初始化相应的客户端
    if (this.mode === 'mock') {
      console.log('[AlibabaIntl] Using mock data mode (default)');
    } else if (this.mode === 'oauth') {
      console.log('[AlibabaIntl] Using OAuth mode with real API');

      const accessToken = await this.tokenManager.getAccessToken();
      if (accessToken) {
        this.apiClient = new AlibabaApiClient({
          accessToken: accessToken,
          baseUrl: this.baseUrl,
          timeout: this.timeout,
          mode: 'oauth'
        });

        console.log('[AlibabaIntl] OAuth API client initialized');
      } else {
        console.warn('[AlibabaIntl] No access token available, falling back to mock mode');
        this.mode = 'mock';
      }
    } else if (this.mode === 'scraping') {
      console.warn('[AlibabaIntl] Using web scraping mode (experimental, may fail)');
      this.apiClient = new AlibabaApiClient({
        baseUrl: this.baseUrl,
        timeout: this.timeout,
        mode: 'scraping'
      });
    } else if (this.mode === 'api') {
      if (!this.apiKey || !this.apiSecret) {
        console.error('[AlibabaIntl] API mode selected but credentials not configured');
        console.log('[AlibabaIntl] Falling back to mock mode');
        this.mode = 'mock';
      } else {
        console.log('[AlibabaIntl] Using API mode');
        this.apiClient = new AlibabaApiClient({
          apiKey: this.apiKey,
          apiSecret: this.apiSecret,
          baseUrl: this.baseUrl,
          timeout: this.timeout,
          mode: 'api'
        });

        // 健康检查
        try {
          const health = await this.apiClient.healthCheck();
          console.log('[AlibabaIntl] API health check:', health);
        } catch (error) {
          console.error('[AlibabaIntl] API health check failed:', error.message);
        }
      }
    }
  }

  async onExecute(capability, params) {
    switch (capability) {
      case 'searchSuppliers':
        return await this.searchSuppliers(params);
      case 'getSupplierInfo':
        return await this.getSupplierInfo(params);
      case 'searchProducts':
        return await this.searchProducts(params);
      case 'comparePrice':
        return await this.comparePrice(params);
      case 'authorize':
        return await this.authorize(params);
      case 'getAuthStatus':
        return await this.getAuthStatus(params);
      case 'revokeAuth':
        return await this.revokeAuth(params);
      default:
        throw new Error(`Unknown capability: ${capability}`);
    }
  }

  /**
   * OAuth 授权
   * Start OAuth authorization flow
   */
  async authorize(params = {}) {
    if (!this.enableOAuth) {
      throw new Error('OAuth is not enabled in plugin configuration');
    }

    if (!this.oauthUI) {
      throw new Error('OAuth UI not initialized');
    }

    try {
      const result = await this.oauthUI.startAuthFlow();

      // 如果授权成功，切换到 OAuth 模式
      if (result.success && !result.alreadyAuthorized) {
        this.mode = 'oauth';

        // 重新初始化 API 客户端
        const accessToken = await this.tokenManager.getAccessToken();
        this.apiClient = new AlibabaApiClient({
          accessToken: accessToken,
          baseUrl: this.baseUrl,
          timeout: this.timeout,
          mode: 'oauth'
        });

        console.log('[AlibabaIntl] Switched to OAuth mode');
      }

      return result;
    } catch (error) {
      console.error('[AlibabaIntl] Authorization failed:', error.message);
      throw error;
    }
  }

  /**
   * 获取授权状态
   * Get authorization status
   */
  async getAuthStatus(params = {}) {
    if (!this.enableOAuth) {
      return {
        success: true,
        oauthEnabled: false,
        message: 'OAuth is not enabled'
      };
    }

    if (!this.tokenManager) {
      return {
        success: true,
        oauthEnabled: true,
        authorized: false,
        message: 'Token manager not initialized'
      };
    }

    try {
      const tokenInfo = await this.tokenManager.getTokenInfo();
      const status = this.oauth.getAuthStatus(await this.tokenManager.loadToken(false));

      return {
        success: true,
        oauthEnabled: true,
        ...tokenInfo,
        ...status,
        currentMode: this.mode
      };
    } catch (error) {
      console.error('[AlibabaIntl] Get auth status failed:', error.message);
      return {
        success: false,
        oauthEnabled: true,
        authorized: false,
        error: error.message
      };
    }
  }

  /**
   * 撤销授权
   * Revoke authorization
   */
  async revokeAuth(params = {}) {
    if (!this.enableOAuth) {
      throw new Error('OAuth is not enabled in plugin configuration');
    }

    if (!this.oauthUI) {
      throw new Error('OAuth UI not initialized');
    }

    try {
      const result = await this.oauthUI.revokeAuth();

      // 撤销后切换回 mock 模式
      this.mode = 'mock';
      this.apiClient = null;

      console.log('[AlibabaIntl] Switched back to mock mode');

      return result;
    } catch (error) {
      console.error('[AlibabaIntl] Revoke auth failed:', error.message);
      throw error;
    }
  }

  /**
   * 搜索供应商
   * Search suppliers
   * @param {object} params - 搜索参数
   * @param {string} params.keyword - 搜索关键词
   * @param {string} params.category - 类别
   * @param {string} params.country - 国家
   * @param {number} params.page - 页码
   * @param {number} params.pageSize - 每页数量
   */
  async searchSuppliers(params) {
    const { keyword, category, country, page = 1, pageSize = 20 } = params;

    if (!keyword) {
      throw new Error('Keyword is required');
    }

    // 检查缓存
    const cacheKey = `suppliers:${keyword}:${category}:${country}:${page}:${pageSize}`;
    if (this.enableCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('[AlibabaIntl] Returning cached suppliers');
        return cached;
      }
    }

    let result;

    if (this.mode === 'mock') {
      result = this.getMockSuppliers(keyword, page, pageSize);
    } else {
      // 使用 API 客户端（支持 API 和 scraping 模式）
      try {
        result = await this.apiClient.searchSuppliers(params);
        console.log('[AlibabaIntl] Suppliers fetched successfully');
      } catch (error) {
        console.error('[AlibabaIntl] Search suppliers failed:', error.message);
        console.log('[AlibabaIntl] Falling back to mock data');
        result = this.getMockSuppliers(keyword, page, pageSize);
      }
    }

    // 缓存结果
    if (this.enableCache) {
      this.setToCache(cacheKey, result);
    }

    return result;
  }

  /**
   * 获取供应商详情
   * Get supplier information
   * @param {object} params - 参数
   * @param {string} params.supplierId - 供应商ID
   */
  async getSupplierInfo(params) {
    const { supplierId } = params;

    if (!supplierId) {
      throw new Error('Supplier ID is required');
    }

    // 检查缓存
    const cacheKey = `supplier:${supplierId}`;
    if (this.enableCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('[AlibabaIntl] Returning cached supplier info');
        return cached;
      }
    }

    let result;

    if (this.mode === 'mock') {
      result = this.getMockSupplierInfo(supplierId);
    } else {
      try {
        result = await this.apiClient.getSupplierInfo(supplierId);
        console.log('[AlibabaIntl] Supplier info fetched successfully');
      } catch (error) {
        console.error('[AlibabaIntl] Get supplier info failed:', error.message);
        console.log('[AlibabaIntl] Falling back to mock data');
        result = this.getMockSupplierInfo(supplierId);
      }
    }

    // 缓存结果
    if (this.enableCache) {
      this.setToCache(cacheKey, result);
    }

    return result;
  }

  /**
   * 搜索产品
   * Search products
   * @param {object} params - 搜索参数
   * @param {string} params.keyword - 搜索关键词
   * @param {number} params.minPrice - 最低价格
   * @param {number} params.maxPrice - 最高价格
   * @param {string} params.sortBy - 排序方式
   * @param {number} params.page - 页码
   * @param {number} params.pageSize - 每页数量
   */
  async searchProducts(params) {
    const { keyword, minPrice, maxPrice, sortBy = 'relevance', page = 1, pageSize = 20 } = params;

    if (!keyword) {
      throw new Error('Keyword is required');
    }

    // 检查缓存
    const cacheKey = `products:${keyword}:${minPrice}:${maxPrice}:${sortBy}:${page}:${pageSize}`;
    if (this.enableCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('[AlibabaIntl] Returning cached products');
        return cached;
      }
    }

    let result;

    if (this.mode === 'mock') {
      result = this.getMockProducts(keyword, page, pageSize);
    } else {
      try {
        result = await this.apiClient.searchProducts(params);
        console.log('[AlibabaIntl] Products fetched successfully');
      } catch (error) {
        console.error('[AlibabaIntl] Search products failed:', error.message);
        console.log('[AlibabaIntl] Falling back to mock data');
        result = this.getMockProducts(keyword, page, pageSize);
      }
    }

    // 缓存结果
    if (this.enableCache) {
      this.setToCache(cacheKey, result);
    }

    return result;
  }

  /**
   * 价格对比
   * Compare prices
   * @param {object} params - 参数
   * @param {string[]} params.productIds - 产品ID列表
   */
  async comparePrice(params) {
    const { productIds } = params;

    if (!productIds || productIds.length === 0) {
      throw new Error('Product IDs are required');
    }

    // 检查缓存
    const cacheKey = `compare:${productIds.sort().join(':')}`;
    if (this.enableCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('[AlibabaIntl] Returning cached price comparison');
        return cached;
      }
    }

    let result;

    if (this.mode === 'mock') {
      result = this.getMockPriceComparison(productIds);
    } else if (this.mode === 'api') {
      try {
        result = await this.apiClient.comparePrice(productIds);
        console.log('[AlibabaIntl] Price comparison fetched successfully');
      } catch (error) {
        console.error('[AlibabaIntl] Compare price failed:', error.message);
        console.log('[AlibabaIntl] Falling back to mock data');
        result = this.getMockPriceComparison(productIds);
      }
    } else {
      // Scraping mode 不支持价格对比
      console.warn('[AlibabaIntl] Price comparison not available in scraping mode');
      result = this.getMockPriceComparison(productIds);
    }

    // 缓存结果
    if (this.enableCache) {
      this.setToCache(cacheKey, result);
    }

    return result;
  }

  // ========== 缓存管理方法 ==========

  /**
   * 从缓存获取数据
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheDuration) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * 设置缓存
   */
  setToCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
    console.log('[AlibabaIntl] Cache cleared');
  }

  // ========== Mock 数据方法 ==========

  getMockSuppliers(keyword, page, pageSize) {
    const mockData = [
      {
        supplierId: 'SUP001',
        name: '深圳市科技电子有限公司',
        country: 'China',
        province: 'Guangdong',
        city: 'Shenzhen',
        rating: 4.8,
        transactionLevel: 'Gold Supplier',
        mainProducts: ['Electronic Components', 'PCB Boards', 'Sensors'],
        yearsInBusiness: 15,
        responseRate: '98%',
        onTimeDelivery: '95%'
      },
      {
        supplierId: 'SUP002',
        name: '浙江优质制造集团',
        country: 'China',
        province: 'Zhejiang',
        city: 'Hangzhou',
        rating: 4.6,
        transactionLevel: 'Verified Supplier',
        mainProducts: ['Textile Products', 'Home Textiles', 'Fabrics'],
        yearsInBusiness: 12,
        responseRate: '95%',
        onTimeDelivery: '92%'
      },
      {
        supplierId: 'SUP003',
        name: '广东精密模具制造有限公司',
        country: 'China',
        province: 'Guangdong',
        city: 'Dongguan',
        rating: 4.9,
        transactionLevel: 'Gold Supplier',
        mainProducts: ['Plastic Molds', 'Injection Molding', 'Metal Parts'],
        yearsInBusiness: 20,
        responseRate: '99%',
        onTimeDelivery: '97%'
      }
    ];

    return {
      success: true,
      data: {
        suppliers: mockData,
        total: mockData.length,
        page,
        pageSize,
        keyword
      }
    };
  }

  getMockSupplierInfo(supplierId) {
    const mockData = {
      supplierId,
      name: '深圳市科技电子有限公司',
      country: 'China',
      province: 'Guangdong',
      city: 'Shenzhen',
      address: 'No.123, Technology Park, Nanshan District, Shenzhen',
      rating: 4.8,
      transactionLevel: 'Gold Supplier',
      mainProducts: ['Electronic Components', 'PCB Boards', 'Sensors'],
      yearsInBusiness: 15,
      employeeCount: '200-500',
      annualRevenue: '$10M - $50M',
      certifications: ['ISO9001', 'CE', 'RoHS', 'FCC'],
      responseRate: '98%',
      onTimeDelivery: '95%',
      description: 'Leading manufacturer of electronic components with 15 years of experience.',
      contactInfo: {
        email: 'sales@example.com',
        phone: '+86-755-12345678',
        website: 'www.example.com'
      }
    };

    return {
      success: true,
      data: mockData
    };
  }

  getMockProducts(keyword, page, pageSize) {
    const mockData = [
      {
        productId: 'PROD001',
        name: 'High Quality USB Cable',
        category: 'Electronics',
        supplierId: 'SUP001',
        supplierName: '深圳市科技电子有限公司',
        price: {
          min: 0.5,
          max: 2.0,
          currency: 'USD',
          unit: 'piece'
        },
        moq: 1000,
        imageUrl: 'https://example.com/product1.jpg',
        description: 'Durable USB cable with fast charging capability',
        specifications: {
          length: '1m/2m/3m',
          connector: 'USB Type-C',
          material: 'TPE + Copper'
        }
      },
      {
        productId: 'PROD002',
        name: 'Wireless Bluetooth Earbuds',
        category: 'Electronics',
        supplierId: 'SUP001',
        supplierName: '深圳市科技电子有限公司',
        price: {
          min: 5.0,
          max: 15.0,
          currency: 'USD',
          unit: 'piece'
        },
        moq: 500,
        imageUrl: 'https://example.com/product2.jpg',
        description: 'Premium wireless earbuds with noise cancellation',
        specifications: {
          battery: '300mAh',
          bluetooth: 'BT 5.0',
          playTime: '6 hours'
        }
      }
    ];

    return {
      success: true,
      data: {
        products: mockData,
        total: mockData.length,
        page,
        pageSize,
        keyword
      }
    };
  }

  getMockPriceComparison(productIds) {
    const mockData = productIds.map((id, index) => ({
      productId: id,
      name: `Product ${index + 1}`,
      suppliers: [
        {
          supplierId: 'SUP001',
          supplierName: '供应商 A',
          price: 10.0 + index * 2,
          currency: 'USD',
          moq: 1000,
          leadTime: '15-20 days',
          rating: 4.8
        },
        {
          supplierId: 'SUP002',
          supplierName: '供应商 B',
          price: 11.0 + index * 2,
          currency: 'USD',
          moq: 500,
          leadTime: '20-25 days',
          rating: 4.6
        },
        {
          supplierId: 'SUP003',
          supplierName: '供应商 C',
          price: 9.5 + index * 2,
          currency: 'USD',
          moq: 2000,
          leadTime: '10-15 days',
          rating: 4.9
        }
      ]
    }));

    return {
      success: true,
      data: {
        comparison: mockData,
        bestPrice: {
          productId: productIds[0],
          supplierId: 'SUP003',
          price: 9.5
        }
      }
    };
  }
}

module.exports = AlibabaIntlPlugin;
