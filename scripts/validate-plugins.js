#!/usr/bin/env node
/**
 * Plugin Validation Script
 * Validates all plugins against Agent Plugins 1.0.0 standard
 */

const fs = require('fs');
const path = require('path');

const PLUGINS_DIR = path.join(__dirname, '..', 'plugins');
const REQUIRED_FIELDS = ['id', 'name', 'version', 'description', 'author', 'type', 'capabilities', 'entrypoint'];
const REQUIRED_TOOL_FIELDS = ['name', 'description', 'parameters'];

class PluginValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.stats = {
      total: 0,
      valid: 0,
      invalid: 0,
      tools: 0
    };
  }

  validate() {
    console.log('🔍 Validating plugins against Agent Plugins 1.0.0 standard...\n');

    const plugins = fs.readdirSync(PLUGINS_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    this.stats.total = plugins.length;

    plugins.forEach(pluginName => {
      this.validatePlugin(pluginName);
    });

    this.printResults();
  }

  validatePlugin(pluginName) {
    const pluginDir = path.join(PLUGINS_DIR, pluginName);
    const configPath = path.join(pluginDir, 'plugin.json');
    const indexPath = path.join(pluginDir, 'index.js');

    console.log(`📦 ${pluginName}`);

    // Check if plugin.json exists
    if (!fs.existsSync(configPath)) {
      this.addError(pluginName, 'plugin.json not found');
      this.stats.invalid++;
      return;
    }

    // Check if index.js exists
    if (!fs.existsSync(indexPath)) {
      this.addWarning(pluginName, 'index.js not found');
    }

    try {
      // Parse JSON
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

      // Validate required fields
      const missingFields = REQUIRED_FIELDS.filter(field => !config[field]);
      if (missingFields.length > 0) {
        this.addError(pluginName, `Missing required fields: ${missingFields.join(', ')}`);
        this.stats.invalid++;
        return;
      }

      // Validate type
      if (config.type !== 'agent-plugin') {
        this.addError(pluginName, `Invalid type: ${config.type} (expected: agent-plugin)`);
        this.stats.invalid++;
        return;
      }

      // Validate version format
      if (!/^\d+\.\d+\.\d+$/.test(config.version)) {
        this.addWarning(pluginName, `Version format should be semantic (x.y.z): ${config.version}`);
      }

      // Validate capabilities
      if (!config.capabilities.tools || !Array.isArray(config.capabilities.tools)) {
        this.addError(pluginName, 'capabilities.tools must be an array');
        this.stats.invalid++;
        return;
      }

      // Validate each tool
      config.capabilities.tools.forEach((tool, index) => {
        const missingToolFields = REQUIRED_TOOL_FIELDS.filter(field => !tool[field]);
        if (missingToolFields.length > 0) {
          this.addError(pluginName, `Tool ${index}: Missing fields: ${missingToolFields.join(', ')}`);
        }

        // Validate parameters schema
        if (tool.parameters) {
          if (tool.parameters.type !== 'object') {
            this.addWarning(pluginName, `Tool ${tool.name}: parameters.type should be 'object'`);
          }
          if (!tool.parameters.properties) {
            this.addWarning(pluginName, `Tool ${tool.name}: parameters.properties not defined`);
          }
        }
      });

      this.stats.tools += config.capabilities.tools.length;

      console.log(`  ✅ Valid (${config.capabilities.tools.length} tools)`);
      this.stats.valid++;

    } catch (error) {
      this.addError(pluginName, `JSON parse error: ${error.message}`);
      this.stats.invalid++;
    }

    console.log('');
  }

  addError(plugin, message) {
    this.errors.push({ plugin, message });
    console.log(`  ❌ ERROR: ${message}`);
  }

  addWarning(plugin, message) {
    this.warnings.push({ plugin, message });
    console.log(`  ⚠️  WARNING: ${message}`);
  }

  printResults() {
    console.log('═'.repeat(60));
    console.log('📊 VALIDATION RESULTS\n');

    console.log(`Total Plugins: ${this.stats.total}`);
    console.log(`Valid: ${this.stats.valid} ✅`);
    console.log(`Invalid: ${this.stats.invalid} ❌`);
    console.log(`Total Tools: ${this.stats.tools}\n`);

    if (this.errors.length > 0) {
      console.log(`❌ ${this.errors.length} Error(s):`);
      this.errors.forEach(({ plugin, message }) => {
        console.log(`   - [${plugin}] ${message}`);
      });
      console.log('');
    }

    if (this.warnings.length > 0) {
      console.log(`⚠️  ${this.warnings.length} Warning(s):`);
      this.warnings.forEach(({ plugin, message }) => {
        console.log(`   - [${plugin}] ${message}`);
      });
      console.log('');
    }

    console.log('═'.repeat(60));

    if (this.stats.invalid > 0) {
      console.log('\n❌ Validation FAILED');
      process.exit(1);
    } else {
      console.log('\n✅ All plugins are valid!');
      process.exit(0);
    }
  }
}

// Run validation
const validator = new PluginValidator();
validator.validate();
