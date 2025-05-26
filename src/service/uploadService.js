// upload.js
import fs from 'fs';
import path from 'path';
import { Dropbox } from 'dropbox';
import fetch from 'node-fetch';

// 1. Khởi tạo Dropbox client
const dbx = new Dropbox({
  accessToken: process.env.ACCESS_TOKEN_DROPBOX, 
  fetch,
});

// 2. Đọc file từ máy local để upload
const filePath = './dataset.jsonl'; // đường dẫn file trên máy
const dropboxPath = '/dataset.jsonl'; // nơi lưu trên Dropbox

fs.readFile(filePath, (err, contents) => {
  if (err) {
    return console.error('Lỗi đọc file:', err);
  }

  // 3. Upload file
  dbx.filesUpload({ path: dropboxPath, contents })
    .then((res) => {
      console.log('✅ Upload thành công:', res.result);
    })
    .catch((error) => {
      console.error('❌ Upload thất bại:', error);
    });
});
