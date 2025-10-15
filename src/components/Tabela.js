// src/pages/CadastroFamilia.js
import Formulario from '../components/Formulario';
import * as cepasService from '../services/cepasService'; // Onde a função de API está

const CadastroFamilia = () => {
    const handleSave = async (dadosDaFamilia) => {
        try {
            const resposta = await cepasService.createFamilia(dadosDaFamilia);
            alert('Família cadastrada com sucesso!');
        } catch (error) {
            alert('Erro ao cadastrar: ' + error.message);
        }
    };

    return (
        <div>
            <h1>Nova Família</h1>
            {/* O Formulario chama handleSave (que é o 'onSave') quando o botão é clicado */}
            <Formulario onSave={handleSave} />
        </div>
    );
};
export default CadastroFamilia;