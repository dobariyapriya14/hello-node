import { Request, Response } from 'express';
import { Todo } from '../models/todo';
import { todos, persist, getNextTodoId } from '../db';

export const getTodos = (req: Request, res: Response): void => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;

    let filteredTodos = todos;
    let isOnline: boolean | undefined = undefined;
    if (req.query.mode !== undefined) {
        isOnline = req.query.mode === 'true';
        filteredTodos = todos.filter((t: Todo) => t.mode === isOnline);
    }

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedTodos = filteredTodos.slice(startIndex, endIndex);

    res.status(200).json({
        success: true,
        data: paginatedTodos,
        pagination: {
            totalItems: filteredTodos.length,
            currentPage: page,
            totalPages: Math.ceil(filteredTodos.length / limit),
            itemsPerPage: limit
        }
    });
};

export const getTodoById = (req: Request, res: Response): void => {
    const { id } = req.params;
    const todo = todos.find((t: Todo) => t.id === id);

    if (!todo) {
        res.status(404).json({ success: false, message: 'Todo not found' });
        return;
    }

    res.status(200).json({ success: true, data: todo });
};

export const createTodo = (req: Request, res: Response): void => {
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
    let imageUrl, pdfUrl;

    if (files && files['image']) {
        imageUrl = `${req.protocol}://${req.get('host')}/uploads/${files['image'][0].filename}`;
    }
    if (files && files['pdf']) {
        pdfUrl = `${req.protocol}://${req.get('host')}/uploads/${files['pdf'][0].filename}`;
    }

    const newTodo: Todo = {
        id: getNextTodoId(),
        title,
        description: description || '',
        completed: false,
        createdAt: new Date(),
        mode: todoMode,
        ...(imageUrl && { image: imageUrl }),
        ...(pdfUrl && { pdf: pdfUrl })
    };

    todos.push(newTodo);
    persist();
    res.status(201).json({ success: true, data: newTodo });
};

export const updateTodo = (req: Request, res: Response): void => {
    const { id } = req.params;
    const { title, description, completed, mode } = req.body;

    const todoIndex = todos.findIndex((t: Todo) => t.id === id);

    if (todoIndex === -1) {
        res.status(404).json({ success: false, message: 'Todo not found' });
        return;
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    let imageUrl, pdfUrl;

    if (files && files['image']) {
        imageUrl = `${req.protocol}://${req.get('host')}/uploads/${files['image'][0].filename}`;
    }
    if (files && files['pdf']) {
        pdfUrl = `${req.protocol}://${req.get('host')}/uploads/${files['pdf'][0].filename}`;
    }

    let todoMode: boolean | undefined = undefined;
    if (mode !== undefined) {
        todoMode = String(mode) === 'true';
    }

    const updatedTodo = {
        ...todos[todoIndex],
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(completed !== undefined && { completed: String(completed) === 'true' }),
        ...(todoMode !== undefined && { mode: todoMode }),
        ...(imageUrl && { image: imageUrl }),
        ...(pdfUrl && { pdf: pdfUrl })
    };

    todos[todoIndex] = updatedTodo;
    persist();
    res.status(200).json({ success: true, data: updatedTodo });
};

export const deleteTodo = (req: Request, res: Response): void => {
    const { id } = req.params;
    const todoIndex = todos.findIndex((t: Todo) => t.id === id);

    if (todoIndex === -1) {
        res.status(404).json({ success: false, message: 'Todo not found' });
        return;
    }

    todos.splice(todoIndex, 1);
    persist();
    res.status(200).json({ success: true, message: 'Todo deleted successfully' });
};
