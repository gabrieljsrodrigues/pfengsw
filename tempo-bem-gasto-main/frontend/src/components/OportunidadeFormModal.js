// frontend/src/components/OportunidadeFormModal.js
import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
    TextField, Button, Typography, Grid, // CircularProgress Removido daqui se não for usado
    Alert, MenuItem, Select, InputLabel, FormControl,
    Modal, Box, IconButton, Divider, Stack
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { IMaskInput } from 'react-imask';

// ... (opportunityValidationSchema e modalStyle permanecem iguais) ...

// Componente de Máscara para o TextField de Data
const DateMaskCustom = React.forwardRef(function DateMaskCustom(props, ref) {
    const { onChange, ...other } = props;
    return (
        <IMaskInput
            {...other}
            mask="00/00/0000"
            definitions={{
                '#': /[0-9]/,
            }}
            inputRef={ref}
            onAccept={(value) => onChange({ target: { name: props.name, value } })}
            overwrite
        />
    );
});


export default function OportunidadeFormModal({ isOpen, onClose, onSubmit, initialValues, isSubmitting, formAlert }) {
    const opportunityFormik = useFormik({
        // ... (initialValues, validationSchema, onSubmit permanecem iguais) ...
    });

    React.useEffect(() => {
        if (!isOpen) {
            opportunityFormik.resetForm();
        } else if (initialValues && initialValues.id) {
            opportunityFormik.setValues(initialValues);
        }
    }, [isOpen, initialValues, opportunityFormik]); // <<--- CORRIGIDO: Adicionado opportunityFormik como dependência


    return (
        <Modal open={isOpen} onClose={onClose} aria-labelledby="modal-title" aria-describedby="modal-description">
            <Box sx={modalStyle}>
                <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500], }}>
                    <CloseIcon />
                </IconButton>

                <Typography variant="h5" component="h2" gutterBottom>
                    {initialValues?.id ? 'Editar Ação Voluntária' : 'Cadastrar Nova Ação Voluntária'}
                </Typography>

                {formAlert && (
                    <Alert severity={formAlert.severity} sx={{ mb: 2 }}>
                        {formAlert.message}
                    </Alert>
                )}

                <form onSubmit={opportunityFormik.handleSubmit}>
                    <Stack spacing={3}>

                        {/* Identificação da ONG */}
                        <Box>
                            <Typography variant="subtitle1" gutterBottom>Identificação da ONG</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Nome da ONG"
                                        name="ong_nome"
                                        value={opportunityFormik.values.ong_nome}
                                        onChange={opportunityFormik.handleChange}
                                        error={opportunityFormik.touched.ong_nome && Boolean(opportunityFormik.errors.ong_nome)}
                                        helperText={opportunityFormik.touched.ong_nome && opportunityFormik.errors.ong_nome}
                                    />
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Informações da Ação */}
                        <Box>
                            <Typography variant="subtitle1" gutterBottom>Informações da Ação</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Stack spacing={2}>
                                <TextField
                                    fullWidth
                                    label="Nome da Ação"
                                    name="titulo"
                                    value={opportunityFormik.values.titulo}
                                    onChange={opportunityFormik.handleChange}
                                    error={opportunityFormik.touched.titulo && Boolean(opportunityFormik.errors.titulo)}
                                    helperText={opportunityFormik.touched.titulo && opportunityFormik.errors.titulo}
                                />

                                <FormControl fullWidth error={opportunityFormik.touched.tipo_acao && Boolean(opportunityFormik.errors.tipo_acao)}>
                                    <InputLabel>Tipo de Ação</InputLabel>
                                    <Select
                                        name="tipo_acao"
                                        label="Tipo de Ação"
                                        value={opportunityFormik.values.tipo_acao}
                                        onChange={opportunityFormik.handleChange}
                                    >
                                        <MenuItem value=""><em>Nenhum</em></MenuItem>
                                        {['Educação', 'Saúde', 'Direitos Humanos', 'Meio Ambiente', 'Assistência Social', 'Cultura e Esporte', 'Causa Animal', 'Inclusão Digital', 'Desenvolvimento Comunitário', 'Outros'].map((tipo) => (
                                            <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
                                        ))}
                                    </Select>
                                    {opportunityFormik.touched.tipo_acao && opportunityFormik.errors.tipo_acao && (
                                        <Typography variant="caption" color="error">{opportunityFormik.errors.tipo_acao}</Typography>
                                    )}
                                </FormControl>

                                <TextField
                                    fullWidth
                                    label="Endereço Completo"
                                    name="endereco"
                                    value={opportunityFormik.values.endereco}
                                    onChange={opportunityFormik.handleChange}
                                    error={opportunityFormik.touched.endereco && Boolean(opportunityFormik.errors.endereco)}
                                    helperText={opportunityFormik.touched.endereco && opportunityFormik.errors.endereco}
                                />

                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <TextField
                                            fullWidth
                                            label="Data da Ação (DD/MM/AAAA)"
                                            name="data_atuacao"
                                            value={opportunityFormik.values.data_atuacao}
                                            onChange={opportunityFormik.handleChange}
                                            error={opportunityFormik.touched.data_atuacao && Boolean(opportunityFormik.errors.data_atuacao)}
                                            helperText={opportunityFormik.touched.data_atuacao && opportunityFormik.errors.data_atuacao}
                                            InputProps={{
                                                inputComponent: DateMaskCustom,
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            fullWidth
                                            label="Horário"
                                            name="carga_horaria"
                                            value={opportunityFormik.values.carga_horaria}
                                            onChange={opportunityFormik.handleChange}
                                            error={opportunityFormik.touched.carga_horaria && Boolean(opportunityFormik.errors.carga_horaria)}
                                            helperText={opportunityFormik.touched.carga_horaria && opportunityFormik.errors.carga_horaria}
                                        />
                                    </Grid>
                                </Grid>

                                <TextField
                                    fullWidth
                                    label="Perfil do Voluntário"
                                    name="perfil_voluntario"
                                    multiline
                                    rows={2}
                                    value={opportunityFormik.values.perfil_voluntario}
                                    onChange={opportunityFormik.handleChange}
                                    error={opportunityFormik.touched.perfil_voluntario && Boolean(opportunityFormik.errors.perfil_voluntario)}
                                    helperText={opportunityFormik.touched.perfil_voluntario && opportunityFormik.errors.perfil_voluntario}
                                />

                                <TextField
                                    fullWidth
                                    label="Descrição da Oportunidade"
                                    name="descricao"
                                    multiline
                                    rows={4}
                                    value={opportunityFormik.values.descricao}
                                    onChange={opportunityFormik.handleChange}
                                    error={opportunityFormik.touched.descricao && Boolean(opportunityFormik.errors.descricao)}
                                    helperText={opportunityFormik.touched.descricao && opportunityFormik.errors.descricao}
                                />
                            </Stack>
                        </Box>

                        {/* Detalhes da Vaga */}
                        <Box>
                            <Typography variant="subtitle1" gutterBottom>Detalhes da Vaga</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="Número de Vagas"
                                        name="num_vagas"
                                        type="number"
                                        value={opportunityFormik.values.num_vagas}
                                        onChange={opportunityFormik.handleChange}
                                        error={opportunityFormik.touched.num_vagas && Boolean(opportunityFormik.errors.num_vagas)}
                                        helperText={opportunityFormik.touched.num_vagas && opportunityFormik.errors.num_vagas}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <FormControl fullWidth error={opportunityFormik.touched.status_vaga && Boolean(opportunityFormik.errors.status_vaga)}>
                                        <InputLabel>Status</InputLabel>
                                        <Select
                                            name="status_vaga"
                                            label="Status"
                                            value={opportunityFormik.values.status_vaga}
                                            onChange={opportunityFormik.handleChange}
                                        >
                                            <MenuItem value="ativa">Ativa</MenuItem>
                                            <MenuItem value="inativa">Inativa</MenuItem>
                                            <MenuItem value="encerrada">Encerrada</MenuItem>
                                            <MenuItem value="em_edicao">Em Edição</MenuItem>
                                        </Select>
                                        {opportunityFormik.touched.status_vaga && opportunityFormik.errors.status_vaga && (
                                            <Typography variant="caption" color="error">{opportunityFormik.errors.status_vaga}</Typography>
                                        )}
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Botões */}
                        <Grid item xs={12}>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                disabled={isSubmitting}
                                sx={{
                                    backgroundColor: '#000',
                                    color: '#fff',
                                    px: 4,
                                    py: 1.5,
                                    fontSize: '1rem',
                                    '&:hover': {
                                        backgroundColor: '#333',
                                    },
                                    width: '100%',
                                }}
                            >
                                {initialValues?.id ? 'Atualizar Ação' : 'Cadastrar Ação'}
                            </Button>

                            {initialValues?.id && (
                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={onClose}
                                    sx={{ mt: 2, width: '100%' }}
                                >
                                    Cancelar Edição
                                </Button>
                            )}
                        </Grid>
                    </Stack>
                </form>
            </Box>
        </Modal>
    );
}