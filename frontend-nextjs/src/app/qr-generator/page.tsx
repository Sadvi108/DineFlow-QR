'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function QRGeneratorPage() {
  const [tableNumber, setTableNumber] = useState<number>(1);
  const [generatedQRs, setGeneratedQRs] = useState<Array<{ table: number; url: string }>>([]);

  const generateQR = () => {
    const baseUrl = window.location.origin;
    const menuUrl = `${baseUrl}/table/${tableNumber}`;
    
    const newQR = {
      table: tableNumber,
      url: menuUrl
    };

    setGeneratedQRs(prev => {
      const filtered = prev.filter(qr => qr.table !== tableNumber);
      return [...filtered, newQR];
    });
  };

  const generateMultipleQRs = () => {
    const baseUrl = window.location.origin;
    const qrs = [];
    
    for (let i = 1; i <= 20; i++) {
      qrs.push({
        table: i,
        url: `${baseUrl}/table/${i}`
      });
    }
    
    setGeneratedQRs(qrs);
  };

  const downloadQR = (tableNum: number) => {
    const svg = document.getElementById(`qr-${tableNum}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 300;
    canvas.height = 300;

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 300, 300);
        ctx.drawImage(img, 0, 0, 300, 300);
        
        const link = document.createElement('a');
        link.download = `table-${tableNum}-qr.png`;
        link.href = canvas.toDataURL();
        link.click();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const printQR = (tableNum: number) => {
    const qrElement = document.getElementById(`qr-container-${tableNum}`);
    if (!qrElement) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Table ${tableNum} QR Code</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 20px;
              margin: 0;
            }
            .qr-container {
              display: inline-block;
              border: 2px solid #000;
              padding: 20px;
              margin: 20px;
            }
            h1 { margin-bottom: 10px; }
            p { margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h1>Table ${tableNum}</h1>
            ${qrElement.innerHTML}
            <p>Scan to view menu and place order</p>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">QR Code Generator</h1>
          <p className="text-gray-600">Generate QR codes for table menus</p>
        </div>

        {/* Generator Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="tableNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Table Number
              </label>
              <input
                type="number"
                id="tableNumber"
                min="1"
                max="100"
                value={tableNumber}
                onChange={(e) => setTableNumber(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={generateQR}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
            >
              Generate QR
            </button>
            <button
              onClick={generateMultipleQRs}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
            >
              Generate All (1-20)
            </button>
          </div>
        </div>

        {/* Generated QR Codes */}
        {generatedQRs.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Generated QR Codes</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {generatedQRs.map((qr) => (
                <div key={qr.table} className="border border-gray-200 rounded-lg p-4 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Table {qr.table}</h3>
                  
                  <div id={`qr-container-${qr.table}`} className="mb-4">
                    <QRCodeSVG
                      id={`qr-${qr.table}`}
                      value={qr.url}
                      size={150}
                      level="M"
                      includeMargin={true}
                      className="mx-auto"
                    />
                  </div>
                  
                  <p className="text-xs text-gray-500 mb-3 break-all">{qr.url}</p>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadQR(qr.table)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded transition-colors"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => printQR(qr.table)}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-sm py-2 px-3 rounded transition-colors"
                    >
                      Print
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Use</h3>
          <ul className="text-blue-800 space-y-2">
            <li>• Enter a table number and click "Generate QR" for a single table</li>
            <li>• Click "Generate All" to create QR codes for tables 1-20</li>
            <li>• Download QR codes as PNG images or print them directly</li>
            <li>• Place the printed QR codes on respective tables</li>
            <li>• Customers can scan the QR code to access the menu for their table</li>
          </ul>
        </div>
      </div>
    </div>
  );
}