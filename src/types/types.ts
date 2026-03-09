export type VideoItem = { id?: string; title?: string; url?: string; videoId?: string; thumb?: string; duration?: number };
export type Submodule = { submoduleId?: string; title?: string; description?: string; videos?: VideoItem[]; quizzes?: any[] };
export type Module = { moduleId?: string; slug?: string; name?: string; description?: string; submodules?: Submodule[] };
export type Course = { courseId?: string; slug?: string; name?: string; description?: string; modules?: Module[] };

export type ProgressEntry = { positionSeconds: number; completed: boolean };
export type Quiz = { id: string; name?: string; submodule_id?: string; course_slug?: string; time_minutes?: number; questions: any[] };