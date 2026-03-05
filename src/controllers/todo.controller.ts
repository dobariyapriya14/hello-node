import { Request, Response } from 'express';
import { Todo } from '../models/todo';

let todos: Todo[] = [];
let nextId = 1;

export const getTodos = (req: Request, res: Response): void => {
    res.status(200).json({ success: true, data: todos });
};

export const getTodoById = (req: Request, res: Response): void => {
    const { id } = req.params;
    const todo = todos.find(t => t.id === id);

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

    const newTodo: Todo = {
        id: (nextId++).toString(),
        title,
        description: description || '',
        completed: false,
        createdAt: new Date()
    };

    todos.push(newTodo);
    res.status(201).json({ success: true, data: newTodo });
};

export const updateTodo = (req: Request, res: Response): void => {
    const { id } = req.params;
    const { title, description, completed } = req.body;

    const todoIndex = todos.findIndex(t => t.id === id);

    if (todoIndex === -1) {
        res.status(404).json({ success: false, message: 'Todo not found' });
        return;
    }

    const updatedTodo = {
        ...todos[todoIndex],
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(completed !== undefined && { completed })
    };

    todos[todoIndex] = updatedTodo;
    res.status(200).json({ success: true, data: updatedTodo });
};

export const deleteTodo = (req: Request, res: Response): void => {
    const { id } = req.params;
    const todoIndex = todos.findIndex(t => t.id === id);

    if (todoIndex === -1) {
        res.status(404).json({ success: false, message: 'Todo not found' });
        return;
    }

    todos.splice(todoIndex, 1);
    res.status(200).json({ success: true, message: 'Todo deleted successfully' });
};
