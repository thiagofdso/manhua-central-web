const fs = require('fs');

let defaultTarget = 'http://localhost:8080';
// Se estiver dentro de um contêiner Docker, direciona para o serviço api-gateway
if (fs.existsSync('/.dockerenv') || process.env.API_GATEWAY_URL) {
  defaultTarget = process.env.API_GATEWAY_URL || 'http://api-gateway:8080';
}

const target = process.env.BACKEND_URL || defaultTarget;

module.exports = {
  "/api": {
    target: target,
    secure: false,
    changeOrigin: true
  }
};
