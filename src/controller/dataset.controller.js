import fs from 'fs';
import { Dropbox } from 'dropbox';
import fetch from 'node-fetch';
import PdfParse from 'pdf-parse';
import Dataset from '../model/dataset.model.js';
import QAPair from '../model/qapair.model.js';
import axios from 'axios';
// Khởi tạo Dropbox
const url = 'sl.u.AFvirmv0hhflL5lwK0HdbRbPBOwaRl6l2hvvh4bG_-Hl2tY6nzmhy8-03WZvewn7z5kgLKiiqUWpS06N3WMU7Wv6KtalL-4Di5ncpzztLr8sp_Q8DsB1e09Fyd6TIimzgCYbdWMw1rlp4ZiWQtlAjde_ZIfGrpg1O63aVwL-ETsu51p-kq1j7iVQRRezlTj8v_RMgG4VZNQ9_6-tDwLw22WQS13TKi7GPe_hPLMV0UrwNwYZ5leSdkcKba6zKNkh5a6zkWA9kLYZDYR0Webp1IAHrMr1gm4g1Q3nAgrLgRlQXKaxeY3_pm6XYV743j6r08mYQi39PAKWjbcgN__MZtOGn8X7MZBUBt7afh-DEVPEQatUk3TlFefz5lwf0Sd-nFzSOLQ-KKpOLQ-rZJ_qJqiC_L14-bj3QYNFXpZeid6mmhHsKLeREVFu9mHoH0zEDXniqCi1melrALb_GWMj1kNJoBxuEyM6Ls_8WjmGjL1OnKMqUOSCdNX_2EZTrgMc2oy1sFCJ0IZVzPJ-0vyNzEZit1DsDkY0UqCflSO9q-1MrFzgaBmxxPJNBvixXsb2w8WbEeDQSKLV5NrET3qm4PQbZU9qL5eJH0mGRM5QXjt4npMbeiVnUx-gTtqHuU3AVr-TwmR1SZQk6hd9ny1Dynwmn3Zemwe9tZ2E8bhjAxVVZaQFyEE5SlpWKDr0I2EQOtd1TEIWRXixH5F8O_2--AW1QadPS7SNSqcKzDo35NlVme3M6oW1rinZtZFlG4Za2f-YlUzp655WYxhFuyogpac7TxbchycFgsrZH6dfehwNGy3epELBz3h-YmBBsi5Li6SZamU7T3Va4mDj4zPljq0fSvczDv9sXMUZSm1PKzN8NZgYTXJETSY72Mc_ENHBXb9I8oUOlFxckLWxam5RR9O1HwL9QeWDR_-gVuj7Je2_MAphhnmaW8oBGzr3_Kn349BKLH_hLjyFph2tHxobYPDHW7PlFlIYBvbTg5zRY5wcxadShIMeqYjhP8wCpTfP034OxnMvN13OIeHitME6gPXHfUs8xFDfJLBTOc74p4KiBTq_pLOi9pb9ygm4nPDBjaCor0linf5YiPGJ5om24CXVIwmocBqgMny81BB-c6Pug58QjFUcZFmd9x8lO7KWsGMu0nqrDmS0Ogs7hDLhoZOMy7jgyhzDF8RmhmRCaCtCyLsYNJzkc0DxY05EQeTi8xPl3OV-W9afpaE4tP3NOgol__X9MkcOV5H-FENvNwcwf5VHxw7bD2dq4OWakbUasLqQhA9UYFRC-vTI-wbc2SZIrywOzYh_209sBxgq1CIBXIlA5GDqmUeQR5rKAZJGVvWjyzIUZFuE32G1MBNPnPWSAIKFpOtRLKuUq_bghXb_I4uRMVz8DcJkU9X7tS3_hT9DPMfw7xk2SYa4Av4-JBpNdAcFAzB-EQX9KoBasa3lOg'
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

    // if (qaDocs.length > 0) {
    //   await QAPair.insertMany(qaDocs);
    // }
     

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
      // const messages = convertToMessages(rawText);
      //     const qaDocs = messages.map(convo => {
      //   const userMsg = convo.messages.find(m => m.role === 'user');
      //   const assistantMsg = convo.messages.find(m => m.role === 'assistant');
      //   return {
      //     question: userMsg?.content || '',
      //     answer: assistantMsg?.content || ''
      //   };
      // }).filter(q => q.question && q.answer); // Lọc dữ liệu rỗng

      // if (qaDocs.length > 0) {
      //   await QAPair.insertMany(qaDocs);
      // }
      const messages = convertToMessages(rawText);
  let qaDocs = messages.map(convo => {
    const userMsg = convo.messages.find(m => m.role === 'user');
    const assistantMsg = convo.messages.find(m => m.role === 'assistant');
    return {
      question: userMsg?.content || '',
      answer: assistantMsg?.content || ''
    };
  }).filter(q => q.question && q.answer); // Lọc ra cặp hợp lệ

  // Gửi request lấy vector và thêm vào mỗi QA
  if (qaDocs.length > 0) {
    for (let i = 0; i < qaDocs.length; i++) {
      try {
        const res = await axios.post('http://localhost:5000/embed', {
          question: qaDocs[i].question
        });
      qaDocs[i].questionVector = res.data.embedding; // vector từ API trả về
      } catch (err) {
        console.error(`Lỗi khi gọi API cho câu hỏi: ${qaDocs[i].question}`);
        console.error(err.message);
        // Bạn có thể bỏ hoặc continue nếu cần
        qaDocs[i].questionVector = [];
      }
    }

    // Lưu tất cả vào DB
    await QAPair.insertMany(qaDocs);

  }
  const finetune = await axios.post('http://localhost:5000/fine-tune', {
    messages:messages,// message
    "num_train_epochs": 3
  })
  console.log(finetune)

      res.json({
        name: fileMeta.name,
        content: rawText,
        messages: messages,
        qaPairs: qaDocs 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  };
// const convertToMessages = (rawText) => {
//   const normalizedText = rawText.replace(/\r\n|\r/g, '\n'); // Chuẩn hoá line breaks
//   const lines = normalizedText.split('\n').map(line => line.trim()).filter(line => line !== '');

//   const conversations = [];
//   let i = 0;

//   while (i < lines.length) {
//     const instructionLine = lines[i];
//     const outputLine = lines[i + 1] || '';

//     if (/^instruction:/i.test(instructionLine) && /^output:/i.test(outputLine)) {
//       const userContent = instructionLine.replace(/^instruction:/i, '').trim();
//       const assistantContent = outputLine.replace(/^output:/i, '').trim();

//       conversations.push({
//         messages: [
//           { role: 'user', content: userContent },
//           { role: 'assistant', content: assistantContent }
//         ]
//       });

//       i += 2; // Nhảy qua 2 dòng đã xử lý
//     } else {
//       i += 1; // Nếu không khớp, chuyển sang dòng kế tiếp
//     }
//   }
  

//   return conversations;
// };
const convertToMessages = (rawText) => {
  const normalizedText = rawText.replace(/\r\n|\r/g, '\n');
  const lines = normalizedText.split('\n').map(line => line.trim()).filter(line => line !== '');

  const conversations = [];
  let i = 0;

  while (i < lines.length) {
    const instructionLine = lines[i];

    if (/^instruction:/i.test(instructionLine)) {
      const userContent = instructionLine.replace(/^instruction:/i, '').trim();
      i++;

      let assistantContent = '';

      if (i < lines.length && /^output:/i.test(lines[i])) {
        assistantContent = lines[i].replace(/^output:/i, '').trim();
        i++;

        // Gom tất cả các dòng tiếp theo không bắt đầu bằng instruction/output
        while (i < lines.length && !/^instruction:/i.test(lines[i])) {
          assistantContent += '\n' + lines[i];
          i++;
        }

        conversations.push({
          messages: [
            { role: 'user', content: userContent },
            { role: 'assistant', content: assistantContent }
          ]
        });
      } else {
        // Không có output => bỏ qua
        i++;
      }
    } else {
      i++;
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



function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return 0;
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return magA && magB ? dot / (magA * magB) : 0;
}

function findBestMatch(userVector, dataset, threshold = 0.1) {
  let bestItem = null;
  let bestScore = -1;

  for (const item of dataset) {
    const score = cosineSimilarity(userVector, item.questionVector);
    if (score > bestScore) {
      bestScore = score;
      bestItem = item;
    }
  }

  if (bestScore < threshold) {
    return null; // không đủ giống
  }

  return {
    bestScore,
    bestItem
  };
}


export const chatAI = async (req, res) => {
  const { question } = req.body;
  console.log(question,'question');

  try {
    if (!question) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: 'Vui lòng nhập câu hỏi'
      });
    }

const response = await axios.post('http://localhost:5000/embed', { question });
const userVector = response.data.embedding;

const dataset = await QAPair.find();
const result = findBestMatch(userVector, dataset, 0.1); // ngưỡng tương đồng

if (!result) {
  return res.status(200).json({
    status: 200,
    success: true,
    message: 'Không tìm thấy câu trả lời phù hợp',
    data: null
  });
}
const answerAI = await axios.post('http://localhost:5000/ask', {
  question: result.bestItem.question,
  context: result.bestItem.answer
});
console.log(response, 'response');
console.log(answerAI, 'answerAI');

return res.status(200).json({
  status: 200,
  success: true,
  message: 'Tìm thấy câu trả lời phù hợp nhất',
  data: {
    question: result.bestItem.question,
    answer: result.bestItem.answer,
    similarity: result.bestScore,
    answerAI: answerAI.data.answer
  }
});

  } catch (error) {
    res.status(500).json({
      status: 500,
      success: false,
      message: 'Lỗi máy chủ',
      error: error.message
    });
  }
};
