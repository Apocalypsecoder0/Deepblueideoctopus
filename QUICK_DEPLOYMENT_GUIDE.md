# DeepBlue:Octopus IDE - Quick FTP Deployment Guide

## 🚀 5-Minute Deployment

### Step 1: Prepare Application
```bash
# Run the automated deployment script
./deploy.sh
```

This creates a `deployment-package/` folder with all necessary files.

### Step 2: Configure Environment
```bash
cd deployment-package/
cp .env.template .env
# Edit .env with your actual database and domain details
```

### Step 3: Upload via FTP
Using your FTP client (FileZilla recommended):
1. Connect to your hosting provider
2. Navigate to `public_html/` or web root
3. Upload ALL files from `deployment-package/`
4. Set permissions: 755 for directories, 644 for files

### Step 4: Server Setup
```bash
# SSH into your server
ssh username@your-server.com
cd public_html/

# Install dependencies
npm install --production

# Setup database
npm run db:push

# Start application
node start.js
# OR use PM2: pm2 start ecosystem.config.js
```

### Step 5: Verify Deployment
- Visit: `https://your-domain.com` (Homepage)
- Test IDE: `https://your-domain.com/ide`
- Admin panel: `https://your-domain.com/admin`

## 📋 Required Hosting Features
- ✅ Node.js 18+ support
- ✅ PostgreSQL database
- ✅ FTP/SFTP access
- ✅ SSH access (for setup)
- ✅ SSL certificate
- ✅ 500MB+ storage
- ✅ 512MB+ RAM

## 🔧 Environment Variables (Required)
```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
SESSION_SECRET=your-32-character-secret-key
REPLIT_DOMAINS=your-domain.com
NODE_ENV=production
PORT=3000
```

## 🆘 Quick Troubleshooting

**App won't start?**
- Check Node.js version: `node --version`
- Verify environment variables in `.env`
- Check logs: `tail -f logs/combined.log`

**Database connection failed?**
- Test connection: `npm run db:status`
- Verify DATABASE_URL format
- Check firewall settings

**Can't access website?**
- Verify domain DNS settings
- Check SSL certificate
- Ensure port 3000 is accessible

## 📞 Support
- **Email**: support@deepblueide.dev
- **Documentation**: https://deepblueide.dev/docs
- **Community**: https://deepblueide.dev/community

## 📦 What's Included in Deployment Package
- Built application files
- Production startup script
- PM2 configuration
- Apache .htaccess rules
- Environment template
- Database migration tools
- Deployment checklist
- Server monitoring setup

---

**Total deployment time: ~15 minutes** (including DNS propagation)

For detailed instructions, see `FTP_DEPLOYMENT_GUIDE.md`