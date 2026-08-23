import express from "express";
import multer from "multer";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "predial-raja-secret";

const dataDir = path.join(__dirname, "data");
const uploadDir = path.join(__dirname, "uploads");

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(uploadDir, { recursive: true });

const db = new Database(path.join(dataDir, "predial-raja.db"));

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadDir));
app.use(express.static(path.join(__dirname, "public")));

db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS condominios (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    unidades INTEGER DEFAULT 0,
    criado_em TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    perfil TEXT NOT NULL DEFAULT 'morador',
    criado_em TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS membros (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL,
    condominio_id TEXT NOT NULL,
    unidade TEXT,
    funcao TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (condominio_id) REFERENCES condominios(id)
  );

  CREATE TABLE IF NOT EXISTS comunicados (
    id TEXT PRIMARY KEY,
    condominio_id TEXT NOT NULL,
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    autor_id TEXT,
    criado_em TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS financeiro (
    id TEXT PRIMARY KEY,
    condominio_id TEXT NOT NULL,
    referencia TEXT NOT NULL,
    total_previsto REAL DEFAULT 0,
    total_recebido REAL DEFAULT 0,
    inadimplencia REAL DEFAULT 0,
    criado_em TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

function id() {
  return crypto.randomUUID();
}

app.get("/api/status", (req, res) => {
  res.json({
    online: true,
    sistema: "Predial Raja"
  });
});

app.get("/api/condominios", (req, res) => {
  const dados = db.prepare(
    "SELECT * FROM condominios ORDER BY nome"
  ).all();

  res.json(dados);
});

app.post("/api/condominios", (req, res) => {
  const { nome, unidades = 0 } = req.body;

  if (!nome) {
    return res.status(400).json({
      erro: "Informe o nome do condomínio."
    });
  }

  const novo = {
    id: id(),
    nome,
    unidades: Number(unidades) || 0
  };

  db.prepare(`
    INSERT INTO condominios (id, nome, unidades)
    VALUES (?, ?, ?)
  `).run(novo.id, novo.nome, novo.unidades);

  res.status(201).json(novo);
});

app.post("/api/login", (req, res) => {
  const { email, senha } = req.body;

  const usuario = db.prepare(
    "SELECT * FROM usuarios WHERE email = ?"
  ).get(email);

  if (!usuario || !bcrypt.compareSync(senha, usuario.senha)) {
    return res.status(401).json({
      erro: "E-mail ou senha inválidos."
    });
  }

  const token = jwt.sign(
    {
      id: usuario.id,
      perfil: usuario.perfil
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil
    }
  });
});

app.post("/api/comunicados", (req, res) => {
  const { condominio_id, titulo, mensagem, autor_id } = req.body;

  if (!condominio_id || !titulo || !mensagem) {
    return res.status(400).json({
      erro: "Dados incompletos."
    });
  }

  const comunicado = {
    id: id(),
    condominio_id,
    titulo,
    mensagem,
    autor_id: autor_id || null
  };

  db.prepare(`
    INSERT INTO comunicados
    (id, condominio_id, titulo, mensagem, autor_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    comunicado.id,
    comunicado.condominio_id,
    comunicado.titulo,
    comunicado.mensagem,
    comunicado.autor_id
  );

  res.status(201).json(comunicado);
});

app.get("/api/dashboard/:condominioId", (req, res) => {
  const registros = db.prepare(`
    SELECT * FROM financeiro
    WHERE condominio_id = ?
    ORDER BY referencia
  `).all(req.params.condominioId);

  const totais = registros.reduce(
    (acc, item) => {
      acc.previsto += item.total_previsto || 0;
      acc.recebido += item.total_recebido || 0;
      return acc;
    },
    { previsto: 0, recebido: 0 }
  );

  const inadimplencia =
    totais.previsto > 0
      ? ((totais.previsto - totais.recebido) / totais.previsto) * 100
      : 0;

  res.json({
    previsto: totais.previsto,
    recebido: totais.recebido,
   
