import { Request, Response } from 'express';
import Todo from '../models/todo';

export interface AuthRequest extends Request {
  user?: any;
}

export const getTodos = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;

        const filter: any = {};
        
        if (req.query.mode !== undefined) {
            filter.mode = req.query.mode === 'true';
        }
        if (req.query.completed !== undefined) {
            filter.completed = req.query.completed === 'true';
        }
        if (req.query.priority) {
            filter.priority = req.query.priority;
        }
        if (req.query.category) {
            filter.category = req.query.category;
        }
        if (req.query.userId || req.user?.id) {
            filter.userId = req.query.userId || req.user?.id;
        }
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        const totalItems = await Todo.countDocuments(filter);
        const startIndex = (page - 1) * limit;
        const paginatedTodos = await Todo.find(filter)
            .populate('category', 'name color icon')
            .populate('userId', 'name email avatar')
            .sort({ createdAt: -1 })
            .skip(startIndex)
            .limit(limit);

        res.status(200).json({
            success: true,
            data: paginatedTodos,
            pagination: {
                totalItems,
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit) || 1,
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
        const todo = await Todo.findById(id)
            .populate('category', 'name color icon')
            .populate('userId', 'name email avatar');

        if (!todo) {
            res.status(404).json({ success: false, message: 'Todo not found' });
            return;
        }

        res.status(200).json({ success: true, data: todo });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const createTodo = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { title, description, mode, priority, dueDate, category, userId } = req.body;

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

        const creatorId = req.user?.id || userId || undefined;

        const newTodo = await Todo.create({
            title,
            description: description || '',
            completed: false,
            mode: todoMode,
            priority: priority || 'medium',
            ...(dueDate && { dueDate: new Date(dueDate) }),
            ...(category && { category }),
            ...(creatorId && { userId: creatorId }),
            ...(imageUrl && { image: imageUrl }),
            ...(pdfUrl && { pdf: pdfUrl })
        });

        const populatedTodo = await Todo.findById(newTodo._id)
            .populate('category', 'name color icon')
            .populate('userId', 'name email avatar');

        res.status(201).json({ success: true, data: populatedTodo });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const updateTodo = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { title, description, completed, mode, priority, dueDate, category, userId } = req.body;

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
        if (priority !== undefined) todo.priority = priority;
        if (dueDate !== undefined) todo.dueDate = dueDate ? new Date(dueDate) : undefined;
        if (category !== undefined) todo.category = category || undefined;
        if (userId !== undefined) todo.userId = userId || undefined;
        if (imageUrl) todo.image = imageUrl;
        if (pdfUrl) todo.pdf = pdfUrl;

        await todo.save();

        const updatedTodo = await Todo.findById(id)
            .populate('category', 'name color icon')
            .populate('userId', 'name email avatar');

        res.status(200).json({ success: true, data: updatedTodo });
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

