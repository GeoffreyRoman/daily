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
    images?: string[];
    created_at?: Date;
    updated_at?: Date;
}
export interface EntryImage {
    id?: number;
    entry_id: number;
    filename: string;
    original_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    upload_date?: Date;
}
export interface User {
    id?: number;
    email: string;
    password_hash: string;
    created_at?: Date;
    updated_at?: Date;
}
//# sourceMappingURL=types.d.ts.map