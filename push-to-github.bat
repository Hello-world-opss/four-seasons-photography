@echo off
cd /d "C:\Users\Lenovo\Desktop\芯核时代\插件生成的摄影师界面"
echo 正在推送到 GitHub...
git push origin main
if %errorlevel% equ 0 (
    echo.
    echo 推送成功！GitHub Pages 将自动部署。
    echo 稍等1-2分钟后访问: https://hello-world-opss.github.io/four-seasons-photography/
) else (
    echo.
    echo 推送失败，请检查网络连接后重试。
)
pause
