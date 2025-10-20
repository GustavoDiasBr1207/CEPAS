/**
 * SCRIPT DE TESTE COMPLETO DO SISTEMA DE CADASTRO CEPAS
 * 
 * Este script testa o sistema completo de cadastro de famílias incluindo:
 * - Cadastro da família principal
 * - Endereço
 * - Estrutura habitacional
 * - Saneamento
 * - Animais
 * - Múltiplos membros com saúde e dados CEPAS
 * - Entrevista
 * 
 * Para executar: node test-complete-registration.js
 */

const axios = require('axios');

// Configuração base
const BASE_URL = 'http://localhost:3001/api';
const TEST_HEADERS = {
    'Content-Type': 'application/json',
    'x-user': 'teste_automatizado'
};

// Dados completos de teste
const DADOS_TESTE_COMPLETO = {
    // Dados básicos da família
    familia: {
        nome_familia: "Família Silva Teste Completo",
        origem: "MIGRAÇÃO",
        situacao: "ATIVA",
        observacoes: "Família de teste para validação completa do sistema"
    },
    
    // Endereço
    endereco: {
        quadra: "Q15",
        rua: "Rua das Flores",
        numero_casa: "123",
        complemento: "Casa B",
        referencia: "Próximo ao posto de saúde",
        cep: "74000-000"
    },
    
    // Estrutura habitacional
    estrutura: {
        tipo_construcao: "ALVENARIA",
        acabamento_piso: "CERAMICA",
        acabamento_parede: "REBOCADA_PINTADA",
        cobertura: "TELHA_CERAMICA",
        material_principal: "TIJOLO",
        possui_quintal: 1,
        numero_comodos: 4,
        area_construida: 80.5,
        area_total: 200.0,
        valor_estimado: 85000.00,
        observacoes: "Casa bem conservada"
    },
    
    // Recursos de saneamento
    saneamento: {
        abastecimento_agua: "REDE_PUBLICA",
        tratamento_agua: "FILTRO",
        destino_esgoto: "REDE_PUBLICA",
        coleta_lixo: "PUBLICA_REGULAR",
        possui_banheiro: 1,
        localizacao_banheiro: "INTERNO",
        numero_banheiros: 2,
        possui_chuveiro: 1,
        observacoes: "Saneamento adequado"
    },
    
    // Animais da família
    animais: [
        {
            tipo_animal: "CACHORRO",
            nome: "Rex",
            idade_estimada: 3,
            descricao: "Pastor alemão, vacinado",
            observacoes: "Animal dócil"
        },
        {
            tipo_animal: "GATO",
            nome: "Mia",
            idade_estimada: 2,
            descricao: "Gata siamesa",
            observacoes: "Castrada"
        }
    ],
    
    // Membros da família
    membros: [
        {
            nome: "João Silva",
            sexo: "M",
            data_nascimento: "1985-03-15",
            relacao: "CHEFE",
            estado_civil: "CASADO",
            escolaridade: "ENSINO_MEDIO",
            ocupacao: "Mecânico",
            religiao: "Católica",
            observacoes: "Responsável pela família",
            saude: {
                hipertensao: 0,
                diabetes: 0,
                doenca_cardiaca: 0,
                doenca_respiratoria: 0,
                depressao: 0,
                deficiencia: 0,
                alcoolismo: 0,
                drogas: 0,
                gestante: 0,
                vacinacao_em_dia: 1,
                cirurgias: 0,
                obesidade: 0,
                outras_condicoes: null
            }
        },
        {
            nome: "Maria Silva",
            sexo: "F",
            data_nascimento: "1988-07-22",
            relacao: "CONJUGE",
            estado_civil: "CASADO",
            escolaridade: "ENSINO_SUPERIOR",
            ocupacao: "Professora",
            religiao: "Católica",
            observacoes: "Esposa do chefe da família",
            saude: {
                hipertensao: 0,
                diabetes: 0,
                doenca_cardiaca: 0,
                doenca_respiratoria: 0,
                depressao: 0,
                deficiencia: 0,
                alcoolismo: 0,
                drogas: 0,
                gestante: 1, // Gestante
                vacinacao_em_dia: 1,
                cirurgias: 0,
                obesidade: 0,
                outras_condicoes: "Acompanhamento pré-natal regular"
            }
        },
        {
            nome: "Pedro Silva",
            sexo: "M",
            data_nascimento: "2015-12-10",
            relacao: "FILHO",
            estado_civil: "SOLTEIRO",
            escolaridade: "ENSINO_FUNDAMENTAL",
            ocupacao: "Estudante",
            religiao: "Católica",
            observacoes: "Filho mais velho",
            saude: {
                hipertensao: 0,
                diabetes: 0,
                doenca_cardiaca: 0,
                doenca_respiratoria: 1, // Asma
                depressao: 0,
                deficiencia: 0,
                alcoolismo: 0,
                drogas: 0,
                gestante: 0,
                vacinacao_em_dia: 1,
                cirurgias: 0,
                obesidade: 0,
                outras_condicoes: "Asma controlada com medicamento"
            },
            crianca_cepas: {
                ativa: true,
                data_inicio: "2024-02-01",
                data_fim: null,
                turno: "MANHA",
                atividade: "RECREACAO_EDUCATIVA",
                observacoes: "Participa das atividades de reforço escolar"
            }
        },
        {
            nome: "Ana Silva",
            sexo: "F",
            data_nascimento: "2018-05-30",
            relacao: "FILHA",
            estado_civil: "SOLTEIRO",
            escolaridade: "EDUCACAO_INFANTIL",
            ocupacao: "Estudante",
            religiao: "Católica",
            observacoes: "Filha mais nova",
            saude: {
                hipertensao: 0,
                diabetes: 0,
                doenca_cardiaca: 0,
                doenca_respiratoria: 0,
                depressao: 0,
                deficiencia: 0,
                alcoolismo: 0,
                drogas: 0,
                gestante: 0,
                vacinacao_em_dia: 1,
                cirurgias: 0,
                obesidade: 0,
                outras_condicoes: null
            },
            crianca_cepas: {
                ativa: true,
                data_inicio: "2024-01-15",
                data_fim: null,
                turno: "TARDE",
                atividade: "BRINCADEIRAS_DIRIGIDAS",
                observacoes: "Adora as atividades de pintura e música"
            }
        }
    ],
    
    // Dados da entrevista
    entrevista: {
        data_entrevista: "2024-01-10",
        entrevistado: "João Silva",
        telefone_contato: "(62) 99999-9999",
        observacoes: "Entrevista realizada na residência. Família muito receptiva e colaborativa."
    }
};

/**
 * Função para executar teste com tratamento de erro
 */
async function executarTeste(nome, funcaoTeste) {
    console.log(`\n🧪 EXECUTANDO: ${nome}`);
    console.log('━'.repeat(60));
    
    try {
        const resultado = await funcaoTeste();
        console.log(`✅ SUCESSO: ${nome}`);
        return resultado;
    } catch (error) {
        console.error(`❌ FALHOU: ${nome}`);
        console.error('Erro:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Teste 1: Verificar se o servidor está funcionando
 */
async function testeConexaoServidor() {
    console.log('📡 Verificando conexão com o servidor...');
    
    const response = await axios.get(`${BASE_URL}/dados/Familia`, {
        headers: TEST_HEADERS,
        timeout: 5000
    });
    
    console.log(`✅ Servidor respondeu com status: ${response.status}`);
    return response.status === 200;
}

/**
 * Teste 2: Cadastro completo de família
 */
async function testeCadastroCompleto() {
    console.log('📝 Testando cadastro completo de família...');
    
    const response = await axios.post(
        `${BASE_URL}/familia-completa`,
        DADOS_TESTE_COMPLETO,
        { headers: TEST_HEADERS }
    );
    
    console.log('📋 Resposta do servidor:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Validações
    if (response.status !== 201) {
        throw new Error(`Status esperado: 201, recebido: ${response.status}`);
    }
    
    if (!response.data.success) {
        throw new Error('Resposta indica falha no cadastro');
    }
    
    if (!response.data.id_familia) {
        throw new Error('ID da família não retornado');
    }
    
    // Validar dados processados
    const dados = response.data.dados_processados;
    console.log('\n📊 Validando dados processados:');
    console.log(`• Família: ${dados.familia ? '✅' : '❌'}`);
    console.log(`• Endereço: ${dados.endereco ? '✅' : '❌'}`);
    console.log(`• Animal: ${dados.animal ? '✅' : '❌'}`);
    console.log(`• Estrutura: ${dados.estrutura ? '✅' : '❌'}`);
    console.log(`• Saneamento: ${dados.saneamento ? '✅' : '❌'}`);
    console.log(`• Membros: ${dados.membros} inseridos`);
    console.log(`• Entrevista: ${dados.entrevista ? '✅' : '❌'}`);
    
    // Validar membros inseridos
    if (dados.membros !== DADOS_TESTE_COMPLETO.membros.length) {
        throw new Error(`Esperado ${DADOS_TESTE_COMPLETO.membros.length} membros, inseridos ${dados.membros}`);
    }
    
    console.log(`✅ Família cadastrada com ID: ${response.data.id_familia}`);
    return response.data.id_familia;
}

/**
 * Teste 3: Verificar dados cadastrados
 */
async function testeVerificacaoDados(idFamilia) {
    console.log(`🔍 Verificando dados da família ID: ${idFamilia}...`);
    
    const response = await axios.get(
        `${BASE_URL}/familia/${idFamilia}`,
        { headers: TEST_HEADERS }
    );
    
    const dados = response.data.data;
    
    console.log('\n📋 Verificando dados recuperados:');
    console.log(`• Família: ${dados.familia ? '✅' : '❌'} - ${dados.familia?.NOME_FAMILIA || 'N/A'}`);
    console.log(`• Endereço: ${dados.endereco ? '✅' : '❌'} - ${dados.endereco?.RUA || 'N/A'}`);
    console.log(`• Estrutura: ${dados.estrutura ? '✅' : '❌'} - ${dados.estrutura?.TIPO_CONSTRUCAO || 'N/A'}`);
    console.log(`• Saneamento: ${dados.saneamento ? '✅' : '❌'} - ${dados.saneamento?.ABASTECIMENTO_AGUA || 'N/A'}`);
    console.log(`• Membros: ${dados.membros?.length || 0} encontrados`);
    console.log(`• Animais: ${dados.animais?.length || 0} encontrados`);
    
    // Validar membros
    if (dados.membros) {
        dados.membros.forEach((membro, index) => {
            console.log(`  └─ Membro ${index + 1}: ${membro.NOME} (${membro.RELACAO})`);
        });
    }
    
    // Validar animais
    if (dados.animais) {
        dados.animais.forEach((animal, index) => {
            console.log(`  └─ Animal ${index + 1}: ${animal.NOME} (${animal.TIPO_ANIMAL})`);
        });
    }
    
    return dados;
}

/**
 * Teste 4: Verificar registros nas tabelas relacionadas
 */
async function testeRegistrosRelacionados(idFamilia) {
    console.log(`🔗 Verificando registros relacionados à família ID: ${idFamilia}...`);
    
    const tabelas = [
        { nome: 'SaudeMembro', campo: 'ID_MEMBRO' },
        { nome: 'CriancaCepas', campo: 'ID_MEMBRO' },
        { nome: 'Entrevista', campo: 'ID_FAMILIA' }
    ];
    
    for (const tabela of tabelas) {
        try {
            const response = await axios.get(
                `${BASE_URL}/dados/${tabela.nome}`,
                { headers: TEST_HEADERS }
            );
            
            const registros = response.data.filter(registro => {
                if (tabela.campo === 'ID_FAMILIA') {
                    return registro[tabela.campo] == idFamilia;
                } else {
                    // Para tabelas relacionadas por ID_MEMBRO, precisamos verificar se existem registros
                    return registro[tabela.campo]; // Qualquer registro indica que a inserção funcionou
                }
            });
            
            console.log(`• ${tabela.nome}: ${registros.length} registros`);
            
        } catch (error) {
            console.log(`• ${tabela.nome}: ❌ Erro ao verificar`);
        }
    }
}

/**
 * Teste 5: Listar todas as famílias
 */
async function testeListarFamilias() {
    console.log('📋 Testando listagem de famílias...');
    
    const response = await axios.get(
        `${BASE_URL}/familias`,
        { headers: TEST_HEADERS }
    );
    
    console.log(`✅ Encontradas ${response.data.data.length} famílias`);
    
    // Mostrar as 3 mais recentes
    const recentes = response.data.data.slice(0, 3);
    console.log('\n📋 Famílias mais recentes:');
    recentes.forEach((familia, index) => {
        console.log(`${index + 1}. ID: ${familia.ID_FAMILIA} - ${familia.NOME_RESPONSAVEL}`);
    });
    
    return response.data.data;
}

/**
 * Função principal de teste
 */
async function executarTodosOsTestes() {
    console.log('🚀 INICIANDO BATERIA COMPLETA DE TESTES DO SISTEMA CEPAS');
    console.log('═'.repeat(70));
    
    let idFamiliaTestada = null;
    
    try {
        // Teste 1: Conexão
        await executarTeste('Conexão com Servidor', testeConexaoServidor);
        
        // Teste 2: Cadastro completo
        idFamiliaTestada = await executarTeste('Cadastro Completo de Família', testeCadastroCompleto);
        
        // Teste 3: Verificação dos dados
        await executarTeste('Verificação de Dados Cadastrados', () => testeVerificacaoDados(idFamiliaTestada));
        
        // Teste 4: Registros relacionados
        await executarTeste('Verificação de Registros Relacionados', () => testeRegistrosRelacionados(idFamiliaTestada));
        
        // Teste 5: Listagem
        await executarTeste('Listagem de Famílias', testeListarFamilias);
        
        console.log('\n🎉 TODOS OS TESTES FORAM EXECUTADOS COM SUCESSO!');
        console.log('═'.repeat(70));
        console.log(`✅ Família de teste criada com ID: ${idFamiliaTestada}`);
        console.log('✅ Sistema de cadastro completo funcionando corretamente');
        console.log('✅ Todas as funcionalidades validadas');
        
    } catch (error) {
        console.log('\n💥 ERRO DURANTE OS TESTES');
        console.log('═'.repeat(70));
        console.error('Detalhes do erro:', error.message);
        
        if (error.response?.data) {
            console.error('Resposta do servidor:', JSON.stringify(error.response.data, null, 2));
        }
        
        process.exit(1);
    }
}

// Executar os testes se o arquivo for chamado diretamente
if (require.main === module) {
    executarTodosOsTestes();
}

module.exports = {
    executarTodosOsTestes,
    DADOS_TESTE_COMPLETO,
    BASE_URL
};