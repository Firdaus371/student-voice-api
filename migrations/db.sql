-- RESET DATABASE
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS aspiration_responses CASCADE;
DROP TABLE IF EXISTS aspirations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS (Tambah kolom avatar_url)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    nim VARCHAR(20) UNIQUE,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'admin')),
    avatar_url TEXT DEFAULT '', -- <--- KOLOM BARU
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. ASPIRATIONS
CREATE TABLE aspirations (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    status VARCHAR(30) NOT NULL DEFAULT 'Menunggu Tinjauan',
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. RESPONSES
CREATE TABLE aspiration_responses (
    id SERIAL PRIMARY KEY,
    aspiration_id INT NOT NULL REFERENCES aspirations(id) ON DELETE CASCADE,
    admin_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. VOTES
CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    aspiration_id INT NOT NULL REFERENCES aspirations(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, aspiration_id)
);

-- 5. COMMENTS
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    aspiration_id INT NOT NULL REFERENCES aspirations(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DATA DUMMY
INSERT INTO users (name, nim, email, password, role) VALUES 
('Admin Kampus', '-', 'admin@unu.ac.id', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'admin'),
('Mahasiswa 1', '2255202010', 'mhs@unu.ac.id', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'student');