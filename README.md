```markdown
 __  __          _                 _ ____  
|  \/  | ___  __| | ___   ___     | / ___| 
| |\/| |/ _ \/ _` |/ _ \ / _ \ _  | \___ \ 
| |  | |  __/ (_| | (_) | (_) | |_| |___) |
|_|  |_|\___|\__,_|\___/ \___/ \___/|____/

```

O MedooJS é a forma mais simples, leve e limpa de interagir com bancos de dados em Node.js. Inspirado no aclamado Medoo do PHP, ele elimina a complexidade e o peso dos ORMs tradicionais, permitindo que você manipule dados usando apenas objetos JavaScript puros.

Desenvolvido para ser agnóstico e seguro por padrão, ele se conecta diretamente ao driver que você já usa, garantindo proteção total contra SQL Injection sem adicionar peso ao seu projeto.

---

## Como Funciona?

Esqueça queries gigantescas em formato de texto ou configurações complexas de modelos. O MedooJS reduz o seu código ao essencial:

```javascript
import { Medoo } from 'medoojs';

// Inicialização direta com o tipo do seu banco
const db = new Medoo({ type: 'mysql', exec: seuPoolDeConexao });

// Buscar um único usuário
const usuario = await db.get('users', '*', { id: 42 });

// Filtrar múltiplos registros com limite
const artigos = await db.select('posts', ['title', 'content'], {
  status: 'published',
  LIMIT: 5
});

// Inserir um novo registro
await db.insert('logs', { acao: 'login', status: 'sucesso' });

// Atualizar dados com segurança
await db.update('products', { preco: 199.90 }, { sku: 'TECL-RGB' });

// Deletar registros de forma direta
await db.delete('sessions', { expirada: 1 });

```

---

## Funciona com o seu Banco de Dados

Não importa a sua infraestrutura. O MedooJS gera a sintaxe exata e segura para o motor escolhido de forma nativa:

* MySQL e MariaDB
* PostgreSQL
* SQLite
* Microsoft SQL Server (MSSQL)
* Oracle
* Sybase

---

## Segurança Transparente

Você foca nos dados, o MedooJS foca na defesa. Toda entrada de dados passada pelos objetos é convertida automaticamente em Prepared Statements nativos do seu banco. Além disso, os nomes de tabelas e colunas passam por uma camada automática de higienização contra invasores, anulando qualquer tentativa de SQL Injection de forma invisível e sem perda de performance.

---

## Instalação Rápida

```bash
npm install medoojs

```

---

## Licença 

Este projeto está sob a licenca MIT.