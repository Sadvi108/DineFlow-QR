const QRCode = require('qrcode');
const fs = require('fs').promises;
const path = require('path');

class QRGenerator {
  constructor(serverIP = '192.168.1.10', port = 3000) {
    this.baseURL = `http://${serverIP}:${port}`;
    this.qrDir = path.join(__dirname, '../../frontend/public/qr-codes');
  }

  async ensureQRDirectory() {
    try {
      await fs.access(this.qrDir);
    } catch (error) {
      await fs.mkdir(this.qrDir, { recursive: true });
    }
  }

  async generateTableQR(tableNumber) {
    try {
      await this.ensureQRDirectory();
      
      const tableURL = `${this.baseURL}/table/${tableNumber}`;
      const qrCodePath = path.join(this.qrDir, `table-${tableNumber}.png`);
      
      // Generate QR code as PNG
      await QRCode.toFile(qrCodePath, tableURL, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Also generate as SVG for better scalability
      const svgPath = path.join(this.qrDir, `table-${tableNumber}.svg`);
      const svgString = await QRCode.toString(tableURL, {
        type: 'svg',
        width: 300,
        margin: 2
      });
      
      await fs.writeFile(svgPath, svgString);

      return {
        tableNumber,
        url: tableURL,
        qrCodePath,
        svgPath
      };
    } catch (error) {
      console.error(`Error generating QR code for table ${tableNumber}:`, error);
      throw error;
    }
  }

  async generateAllTableQRs(maxTables = 20) {
    const results = [];
    
    for (let i = 1; i <= maxTables; i++) {
      try {
        const result = await this.generateTableQR(i);
        results.push(result);
        console.log(`Generated QR code for table ${i}`);
      } catch (error) {
        console.error(`Failed to generate QR code for table ${i}:`, error);
      }
    }
    
    return results;
  }

  async generateQRAsDataURL(tableNumber) {
    try {
      const tableURL = `${this.baseURL}/table/${tableNumber}`;
      const dataURL = await QRCode.toDataURL(tableURL, {
        width: 300,
        margin: 2
      });
      
      return {
        tableNumber,
        url: tableURL,
        dataURL
      };
    } catch (error) {
      console.error(`Error generating QR data URL for table ${tableNumber}:`, error);
      throw error;
    }
  }
}

module.exports = QRGenerator;