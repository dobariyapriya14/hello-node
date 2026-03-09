import { Request, Response } from 'express';
import { Todo } from '../models/todo';
import { todos, persist, getNextTodoId } from '../db';

export const getTodos = (req: Request, res: Response): void => {
    res.status(200).json({ success: true, data: todos });
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
    const { title, description } = req.body;

    if (!title) {
        res.status(400).json({ success: false, message: 'Title is required' });
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

    const newTodo: Todo = {
        id: getNextTodoId(),
        title,
        description: description || '',
        completed: false,
        createdAt: new Date(),
        ...(imageUrl && { image: imageUrl }),
        ...(pdfUrl && { pdf: pdfUrl })
    };

    todos.push(newTodo);
    persist();
    res.status(201).json({ success: true, data: newTodo });
};

export const updateTodo = (req: Request, res: Response): void => {
    const { id } = req.params;
    const { title, description, completed } = req.body;

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

    const updatedTodo = {
        ...todos[todoIndex],
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(completed !== undefined && { completed: String(completed) === 'true' }),
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
