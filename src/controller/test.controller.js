import express from 'express';
import Name from '../model/name.model.js';


export const getTest = async(req, res) => {

    try {
       const getName = await Name.find();
         res.status(200).json({message:'lay ten thanh cong', data: getName, status: true})
    } catch (error) {
         res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
}




