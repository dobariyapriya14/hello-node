import { Request, Response } from 'express';
import Todo from '../models/todo';

export const getTodos = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 5;

        const filter: any = {};
        if (req.query.mode !== undefined) {
            filter.mode = req.query.mode === 'true';
        }

        const totalItems = await Todo.countDocuments(filter);
        const startIndex = (page - 1) * limit;
        const paginatedTodos = await Todo.find(filter).skip(startIndex).limit(limit);

        res.status(200).json({
            success: true,
            data: paginatedTodos,
            pagination: {
                totalItems,
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
                itemsPerPage: limit
            }
        });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getTodoById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params; 
        const todo = await Todo.findById(id);

        if (!todo) {
            res.status(404).json({ success: false, message: 'Todo not found' });
            return;
        }

        res.status(200).json({ success: true, data: todo });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const createTodo = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, description, mode } = req.body;

        if (!title) {
            res.status(400).json({ success: false, message: 'Title is required' });
            return;
        }

        let todoMode = false;
        if (String(mode) === 'true') {
            todoMode = true;
        }

        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        let imageUrl: string | undefined;
        let pdfUrl: string | undefined;

        if (files && files['image']) {
            imageUrl = `${req.protocol}://${req.get('host')}/uploads/${files['image'][0].filename}`;
        }
        if (files && files['pdf']) {
            pdfUrl = `${req.protocol}://${req.get('host')}/uploads/${files['pdf'][0].filename}`;
        }

        const newTodo = await Todo.create({
            title,
            description: description || '',
            completed: false,
            mode: todoMode,
            ...(imageUrl && { image: imageUrl }),
            ...(pdfUrl && { pdf: pdfUrl })
        });

        res.status(201).json({ success: true, data: newTodo });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const updateTodo = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { title, description, completed, mode } = req.body;

        const todo = await Todo.findById(id);
        if (!todo) {
            res.status(404).json({ success: false, message: 'Todo not found' });
            return;
        }

        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        let imageUrl: string | undefined;
        let pdfUrl: string | undefined;

        if (files && files['image']) {
            imageUrl = `${req.protocol}://${req.get('host')}/uploads/${files['image'][0].filename}`;
        }
        if (files && files['pdf']) {
            pdfUrl = `${req.protocol}://${req.get('host')}/uploads/${files['pdf'][0].filename}`;
        }

        if (title !== undefined) todo.title = title;
        if (description !== undefined) todo.description = description;
        if (completed !== undefined) todo.completed = String(completed) === 'true';
        if (mode !== undefined) todo.mode = String(mode) === 'true';
        if (imageUrl) todo.image = imageUrl;
        if (pdfUrl) todo.pdf = pdfUrl;

        await todo.save();

        res.status(200).json({ success: true, data: todo });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const deleteTodo = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const todo = await Todo.findByIdAndDelete(id);

        if (!todo) {
            res.status(404).json({ success: false, message: 'Todo not found' });
            return;
        }

        res.status(200).json({ success: true, message: 'Todo deleted successfully' });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};
