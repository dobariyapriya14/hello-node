export interface Todo {
    id: string;
    title: string;
    description?: string;
    completed: boolean;
    createdAt: Date;
    image?: string;
    pdf?: string;
    mode?: boolean;
}
