async function salvar_ONG_Oportunidade() {
    const DataOportunidade = {
        nome: "GreenLeaf",
        endereco: "Avenida blalaal 112, SP",
        titulo: "AAA",
        descricao:"BBBBBB"
    };

    try {
        const response = await fetch('http://localhost:8000/salvar_ONG_Oportunidade/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(DataOportunidade)
        });

        const text = await response.text(); // tenta pegar o corpo como texto

        if (response.ok) {
            // tenta converter para JSON, se possível
            let data;
            try {
                data = JSON.parse(text);
            } catch {
                data = { message: text };
            }
            console.log('Sucesso:', data.message);
        } else {
            console.error('Erro:', text); // resposta em texto se falhar
        }

    } catch (err) {
        console.error('Erro de rede ou outro:', err);
    }
}


salvar_ONG_Oportunidade();

