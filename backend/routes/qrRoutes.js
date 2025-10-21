const express = require('express');
const router = express.Router();
const { generateQRCode, generateQRCodeDataURL, generateMultipleQRCodes } = require('../utils/generateQR');

// Generate QR code for a single table
router.post('/generate', async (req, res) => {
    try {
        const { tableNumber, serverIP = 'localhost', port = 3000 } = req.body;
        
        if (!tableNumber) {
            return res.status(400).json({ error: 'Table number is required' });
        }
        
        const url = `http://${serverIP}:${port}/table/${tableNumber}`;
        const qrCodeDataURL = await generateQRCodeDataURL(url);
        
        res.json({
            success: true,
            tableNumber,
            url,
            qrCodeDataURL
        });
        
    } catch (error) {
        console.error('Error generating QR code:', error);
        res.status(500).json({ error: 'Failed to generate QR code' });
    }
});

// Generate QR codes for multiple tables
router.post('/generate-multiple', async (req, res) => {
    try {
        const { startTable, endTable, serverIP = 'localhost', port = 3000 } = req.body;
        
        if (!startTable || !endTable) {
            return res.status(400).json({ error: 'Start table and end table numbers are required' });
        }
        
        if (startTable > endTable) {
            return res.status(400).json({ error: 'Start table must be less than or equal to end table' });
        }
        
        const qrCodes = [];
        
        for (let tableNumber = startTable; tableNumber <= endTable; tableNumber++) {
            const url = `http://${serverIP}:${port}/table/${tableNumber}`;
            const qrCodeDataURL = await generateQRCodeDataURL(url);
            
            qrCodes.push({
                tableNumber,
                url,
                qrCodeDataURL
            });
        }
        
        res.json({
            success: true,
            qrCodes,
            totalGenerated: qrCodes.length
        });
        
    } catch (error) {
        console.error('Error generating multiple QR codes:', error);
        res.status(500).json({ error: 'Failed to generate QR codes' });
    }
});

// Generate and save QR codes to files (for server-side generation)
router.post('/generate-files', async (req, res) => {
    try {
        const { tableNumbers, serverIP = 'localhost', port = 3000, format = 'png' } = req.body;
        
        if (!tableNumbers || !Array.isArray(tableNumbers)) {
            return res.status(400).json({ error: 'Table numbers array is required' });
        }
        
        const results = [];
        
        for (const tableNumber of tableNumbers) {
            const url = `http://${serverIP}:${port}/table/${tableNumber}`;
            const filename = await generateQRCode(url, tableNumber, format);
            
            results.push({
                tableNumber,
                url,
                filename,
                path: `./qr-codes/${filename}`
            });
        }
        
        res.json({
            success: true,
            results,
            totalGenerated: results.length,
            message: `Generated ${results.length} QR code files`
        });
        
    } catch (error) {
        console.error('Error generating QR code files:', error);
        res.status(500).json({ error: 'Failed to generate QR code files' });
    }
});

// Generate QR codes for a range of tables and save to files
router.post('/generate-range-files', async (req, res) => {
    try {
        const { startTable, endTable, serverIP = 'localhost', port = 3000, format = 'png' } = req.body;
        
        if (!startTable || !endTable) {
            return res.status(400).json({ error: 'Start table and end table numbers are required' });
        }
        
        if (startTable > endTable) {
            return res.status(400).json({ error: 'Start table must be less than or equal to end table' });
        }
        
        const results = await generateMultipleQRCodes(startTable, endTable, serverIP, port, format);
        
        res.json({
            success: true,
            results,
            totalGenerated: results.length,
            message: `Generated QR codes for tables ${startTable} to ${endTable}`
        });
        
    } catch (error) {
        console.error('Error generating QR code range files:', error);
        res.status(500).json({ error: 'Failed to generate QR code files' });
    }
});

// Get QR code info for a specific table
router.get('/table/:tableNumber', async (req, res) => {
    try {
        const { tableNumber } = req.params;
        const { serverIP = 'localhost', port = 3000 } = req.query;
        
        const url = `http://${serverIP}:${port}/table/${tableNumber}`;
        const qrCodeDataURL = await generateQRCodeDataURL(url);
        
        res.json({
            success: true,
            tableNumber: parseInt(tableNumber),
            url,
            qrCodeDataURL
        });
        
    } catch (error) {
        console.error('Error getting QR code info:', error);
        res.status(500).json({ error: 'Failed to get QR code info' });
    }
});

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'QR code service is running',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;