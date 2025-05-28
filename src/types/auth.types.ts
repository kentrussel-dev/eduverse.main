export interface User {
    id: string;
    email: string;
    fullName: string;
    avatar: string;
    isTeacher: boolean;
}

export interface LoginFormData {
    email: string;
    password: string;
}

export interface RegisterFormData {
    email: string;
    password: string;
    fullName: string;
    isTeacher: boolean;
}
