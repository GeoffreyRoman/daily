export interface JournalEntry {
    id?: number;
    user_id: number;
    date: Date;
    content: string;
    ai_generated: boolean;
    prompt?: string;
    location_name?: string;
    latitude?: number;
    longitude?: number;
    entry_images?: EntryImage[]; // Images en base64
    created_at?: Date;
    updated_at?: Date;
}

export interface EntryImage {
    id?: number;
    entry_id: number;
    original_name: string;
    mime_type: string;
    file_size: number;
    image_data: string; // Base64 de l'image
    created_at?: Date;
}

export interface User {
    id?: number;
    email: string;
    password_hash: string;
    created_at?: Date;
    updated_at?: Date;
}
