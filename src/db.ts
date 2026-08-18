export const users: any[] = [];
export const refreshTokens: any[] = [];
export const otps: Record<string, any> = {};
export const todos: any[] = [];

let nextTodoId = 1;
export const getNextTodoId = () => String(nextTodoId++);

export const persist = async () => {
    // dummy persist function
};
