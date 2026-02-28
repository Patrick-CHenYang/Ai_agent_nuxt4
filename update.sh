#阿里云服务器 https://home.console.aliyun.com/home/dashboard/ProductAndService
#本地 1. 构建
npm run build

# 2. 上传 .output 目录到服务器 (覆盖旧文件)
# 注意：这里假设你本地当前就在项目根目录
scp -r ./.output/* root@43.99.11.89:/root/nuxt-app/.output/

#!/bin/bash服务器执行
echo "🚀 开始更新 Nuxt 应用..."
cd /root/nuxt-app/.output/server
pnpm install --production
pm2 restart nuxt-app
echo "✅ 更新完成！"
pm2 status nuxt-app

