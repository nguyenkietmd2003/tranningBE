import fs from 'fs';
import { Dropbox } from 'dropbox';
import fetch from 'node-fetch';
import PdfParse from 'pdf-parse';
import Dataset from '../model/dataset.model.js';
import QAPair from '../model/qapair.model.js';
// Khởi tạo Dropbox
const url = 'sl.u.AFtiPXeTLmfr1WvwDQePZzvATevpxcIKlt1X9KdVk8na8DaIgS6FWncLD1bDflWLjsxndpM_NY8BSdd75TgqrR5Lu9tOwCdRgnkweP_KIFbjqO75vAnXREcf1VF5MIUUAduJgYh25xPJu9MD9e6J-aPDl9VMlJH4rXmimguOiMN_ELH2-1j4214W6fdxRXokghW3pdDI2GFOY0AQNRZsyaK_AeRvAF3Apa9FqpWuPRP0I8KQBvJfXznLBjqSfTTZ_D8311BclKLcV-5R7qZ_5gw8EnHqcbYPHNdpqAxSgDk3Z1y2F4N0wh5sEBX0CiPiQBaknQ8Opf_66rBFutTzutv3ibu0SF8BOP44p2Cmbn4vh-gOMvpcUhjPeRnExuWWxnRUZ68VjEYOp8u2IPavVK1W1zcTxSkokrLSa7j0lxnQ-aGB7BEZ4rJti4rlzOwkb48EuHuClT2G5oFmH9LIA3HTJzP1iA70FdKI7gqJdqPrymye9gFeCTfKGXjjXyXx5h4s1zZo_gamycL8MdjdbGqK-0KigEQFouBXCfsOjtcclLKG62_hlkbwjMxA-lHXhjU66RpO1YNhY7d4RXXTJVQvIxALkVCwWLFHW4mdrN1P2M9Yw2lYmakeAJYhKRVd3psV3qxis4fB25Vlu7s4R4P3t-mw0GdPcdIwrjhgmiFP3QOSrKjLn5I5I1fGzoB6ErNu7Gcijm5cRZqWKBFbyuolGzGQebRWdXtN6QGnqWGlpYXutgmOeAdJq1blpJXWKiKaxlFv0vtYVunZQ7Bk2ZymiRw-OFUqV6iMluxN1PsKJb2O4ZZ3zdxMEOY2qXUC-EG1lMV92p48rarkAePZHSuzxKemMimnzlwX0Wr98AmyniX99jVH_pS55WmaKXOSsRRZeVWDYydLGmJ0nlGUMypKjBQC_j__1515wUF9bvHZ8RR7Oc3iRs-Ghmw3I__EECqQNgXBqQUzlbMf48Dd641b3O6eprl-zJ4UzZQyxwBHfqNaOZ5kbz_gzTW4KoXHIW2RhFR7zwTHFR3CF1ZpACq8zFj9inXscTVJvX4pGTj9_OLjfVnsHYeCfbHauTXAPVGgD6-hqF6DtV61Rhf1qu_tDFAjvbJftI93tjE7qVfA-5BOgFxL4kxjuDz_n0q7dVz6pOS5_XGlH-fmb1fpHU0IlIQvHNxs8X9SeholLkOSmPiOhx5A0x3lb5Iq-FHhWv8ezOOqn7qi2C_097lZ0iXIX7KxRsU0VTfDd4vmBxgQeFcaRYbrCrEYWtlvN_4BbhwpUpRYRcvLVkGDdWPzUqPWCnuWMn0Eb0T3aUwvNM86bU4a6a6jJ2IPh5AcZuVSbAxd1MuloHnt9_ibf0XkC-3a4S9Jd6WVB056LaR7n8qMq0_SDregp6UJh2L0wCyf4zKUUlRNSPNBXXDo_HLCRhuS27MXpfF4FESEwsXfs3bBFA'
const dbx = new Dropbox({ accessToken: url, fetch });

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        status: 400,
        message: 'No file uploaded' 
      });
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname;

    // Kiểm tra trùng tên trước khi upload lên Dropbox (nếu bạn không cần trùng fileId)
    const existingDataset = await Dataset.findOne({ name: originalName });
    if (existingDataset) {
      // Xóa file local trước khi trả về lỗi
      fs.unlinkSync(filePath);

      return res.status(409).json({
        status: 409,
        message: 'File đã tồn tại trong cơ sở dữ liệu',
        dataset: existingDataset,
      });
    }

    // Đọc file
    const fileContent = fs.readFileSync(filePath);

    // Upload lên Dropbox
    const dropboxResponse = await dbx.filesUpload({
      path: '/' + originalName,
      contents: fileContent,
      mode: 'add',
      autorename: true,
    });

    // Xóa file local sau khi upload
    fs.unlinkSync(filePath);

    // Lưu thông tin vào DB
    const newDataset = new Dataset({
      name: dropboxResponse.result.name,
      fileId: dropboxResponse.result.id,
      isFinetuned: false,
    });

    await newDataset.save();

    return res.status(201).json({
      status: 201,
      message: 'File uploaded và lưu vào cơ sở dữ liệu',
      dropbox: dropboxResponse.result,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: 500,
      message: 'Đã xảy ra lỗi trong quá trình upload hoặc lưu dữ liệu',
      error: error.message,
    });
  }
};


export const viewFile = async (req, res) => {
  try {
    const { id } = req.params; // Ví dụ: /1746949115375-585860-LAB 3.pdf

    if (!id) {
      return res.status(400).json({ message: 'Missing filePath in query' });
    }

    const response = await dbx.filesGetTemporaryLink({ path: id });

    res.json({
      message: 'Temporary link generated',
      link: response.result.link,
    });
  } catch (error) {
    res.status(500).json({ error: error.message, message: error });
  }
};


export const deleteAllDropboxFiles = async (req, res) => {
  try {
    const allFiles = [];
    let response = await dbx.filesListFolder({ path: '', recursive: true });

    allFiles.push(...response.result.entries);

    while (response.result.has_more) {
      response = await dbx.filesListFolderContinue({ cursor: response.result.cursor });
      allFiles.push(...response.result.entries);
    }

    // Lọc chỉ lấy file
    const filesToDelete = allFiles
      .filter(item => item['.tag'] === 'file')
      .map(file => ({ path: file.path_lower }));

    if (filesToDelete.length === 0) {
      return res.json({ message: 'No files found to delete.' });
    }

    // Xoá hàng loạt
    const deleteResponse = await dbx.filesDeleteBatch({ entries: filesToDelete });

    res.json({
      message: 'Delete request sent for all files.',
      deleteResponse: deleteResponse.result,
    });
  } catch (error) {
    console.error('Error deleting files:', error);
    res.status(500).json({ error: error.message });
  }
};




export const listDropboxFiles = async (req, res) => {
  try {
    const allFiles = [];
    let response = await dbx.filesListFolder({ path: '', recursive: true });

    allFiles.push(...response.result.entries);

    while (response.result.has_more) {
      response = await dbx.filesListFolderContinue({ cursor: response.result.cursor });
      allFiles.push(...response.result.entries);
    }

    // Lọc chỉ lấy file (bỏ folder)
    const fileList = allFiles
      .filter(item => item['.tag'] === 'file')
      .map(file => ({
        id: file.id,
        name: file.name,
        path_lower: file.path_lower,
        path_display: file.path_display,
        size: file.size,
        client_modified: file.client_modified,
        server_modified: file.server_modified,
        rev: file.rev,
        content_hash: file.content_hash,
      }));

    res.json({ files: fileList });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: error.message });
  }
};


export const analyzePdfById = async (req, res) => {
  try {
    const { id } = req.params;

    // B1: Lấy danh sách file để tìm path theo id
    let response = await dbx.filesListFolder({ path: '', recursive: true });
    let allFiles = response.result.entries;

    while (response.result.has_more) {
      response = await dbx.filesListFolderContinue({ cursor: response.result.cursor });
      allFiles.push(...response.result.entries);
    }

    const fileMeta = allFiles.find(file => file.id === id);
    if (!fileMeta) {
      return res.status(404).json({ message: 'File not found' });
    }

    // B2: Tải file về dưới dạng buffer
    const downloadRes = await dbx.filesDownload({ path: fileMeta.path_lower });
    const buffer = downloadRes.result.fileBinary;

    // B3: Phân tích (ví dụ đọc PDF)
    const data = await PdfParse(buffer);

    res.json({
      name: fileMeta.name,
      content: data.text, // Hoặc data.numpages, info, metadata, etc.
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};



export const analyzePdfById1 = async (req, res) => {
  try {
    const { id } = req.params;

    // B1: Lấy danh sách file
    let response = await dbx.filesListFolder({ path: '', recursive: true });
    let allFiles = response.result.entries;

    while (response.result.has_more) {
      response = await dbx.filesListFolderContinue({ cursor: response.result.cursor });
      allFiles.push(...response.result.entries);
    }

    const fileMeta = allFiles.find(file => file.id === id);
    if (!fileMeta) {
      return res.status(404).json({ message: 'File not found' });
    }

    // B2: Tải file
    const downloadRes = await dbx.filesDownload({ path: fileMeta.path_lower });
    const buffer = downloadRes.result.fileBinary;

    // B3: Phân tích PDF
    const data = await PdfParse(buffer);
    const rawText = data.text;

    // B4: Chuyển thành messages
    const messages = convertToMessages(rawText);
        const qaDocs = messages.map(convo => {
      const userMsg = convo.messages.find(m => m.role === 'user');
      const assistantMsg = convo.messages.find(m => m.role === 'assistant');
      return {
        question: userMsg?.content || '',
        answer: assistantMsg?.content || ''
      };
    }).filter(q => q.question && q.answer); // Lọc dữ liệu rỗng

    if (qaDocs.length > 0) {
      await QAPair.insertMany(qaDocs);
    }

    res.json({
      name: fileMeta.name,
      content: rawText,
      messages: messages
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
const convertToMessages = (rawText) => {
  const normalizedText = rawText.replace(/\r\n|\r/g, '\n'); // Chuẩn hoá line breaks
  const lines = normalizedText.split('\n').map(line => line.trim()).filter(line => line !== '');

  const conversations = [];
  let i = 0;

  while (i < lines.length) {
    const instructionLine = lines[i];
    const outputLine = lines[i + 1] || '';

    if (/^instruction:/i.test(instructionLine) && /^output:/i.test(outputLine)) {
      const userContent = instructionLine.replace(/^instruction:/i, '').trim();
      const assistantContent = outputLine.replace(/^output:/i, '').trim();

      conversations.push({
        messages: [
          { role: 'user', content: userContent },
          { role: 'assistant', content: assistantContent }
        ]
      });

      i += 2; // Nhảy qua 2 dòng đã xử lý
    } else {
      i += 1; // Nếu không khớp, chuyển sang dòng kế tiếp
    }
  }
  

  return conversations;
};




// 

export const getListFile = async (req, res) => {
  try {
    const response = await Dataset.find();
    return res.status(200).json({
      status: 200,
      message: 'Lấy danh sách file thành công',
      data: response,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
    
  }
}



export const chatAI =async (req, res) => {
  const { question } = req.body;

  try {
      if (!question) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: 'Vui lòng nhập câu hỏi'
      }); 
    }
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
    
  }
}
