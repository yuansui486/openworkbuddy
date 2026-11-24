@echo off
chcp 65001 >nul
cls

echo.
echo ============================================
echo   OpenWorkBuddy v1.1.0 - 插件测试
echo ============================================
echo.

cd /d E:\MyProject\openworkbuddy\plugins

echo 正在测试所有外贸插件...
echo.

node test-foreign-trade.js

echo.
echo ============================================
echo 测试完成！
echo ============================================
echo.
pause
