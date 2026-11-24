@echo off
chcp 65001 >nul
cls

echo.
echo ============================================
echo   OpenWorkBuddy v1.1.0
echo   阿里巴巴 OAuth 授权
echo ============================================
echo.

cd /d E:\MyProject\openworkbuddy\plugins\alibaba-intl

echo 正在启动授权流程...
echo.
echo 步骤:
echo   1. 生成授权 URL
echo   2. 启动本地回调服务器
echo   3. 浏览器打开授权页面
echo   4. 登录阿里巴巴账号
echo   5. 授权成功后自动保存 Token
echo.
echo ============================================
echo.

node auth-cli.js

echo.
pause
