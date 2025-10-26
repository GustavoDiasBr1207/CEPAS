const bcrypt = require('bcrypt');
const { updateRecord, fetchTableData } = require('./oracle');

async function atualizarSenhasUsuarios() {
    console.log('🔐 Atualizando senhas dos usuários padrão...');

    try {
        // Definir as senhas para os usuários padrão
        const usuariosParaAtualizar = [
            { username: 'admin', senha: 'admin123' },
            { username: 'monitor1', senha: 'monitor123' },
            { username: 'visual1', senha: 'visual123' }
        ];

        for (const { username, senha } of usuariosParaAtualizar) {
            console.log(`Atualizando senha para: ${username}`);

            // Buscar o usuário
            const usuarios = await fetchTableData('Usuario', 
                `SELECT id_usuario FROM Usuario WHERE username = :username`,
                { username }
            );

            if (usuarios && usuarios.length > 0) {
                // Gerar hash da senha
                const passwordHash = await bcrypt.hash(senha, 12);

                // Atualizar a senha
                await updateRecord('Usuario', usuarios[0].ID_USUARIO, {
                    password_hash: passwordHash
                });

                console.log(`✅ Senha atualizada para ${username}`);
            } else {
                console.log(`⚠️ Usuário ${username} não encontrado`);
            }
        }

        console.log('🎉 Todas as senhas foram atualizadas com sucesso!');
        console.log('Senhas padrão:');
        console.log('- admin: admin123');
        console.log('- monitor1: monitor123');
        console.log('- visual1: visual123');

    } catch (error) {
        console.error('❌ Erro ao atualizar senhas:', error);
    }

    process.exit(0);
}

// Executar apenas se chamado diretamente
if (require.main === module) {
    atualizarSenhasUsuarios();
}

module.exports = { atualizarSenhasUsuarios };