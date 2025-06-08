// frontend/src/components/OportunidadeFormModal.js
import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
    TextField, Button, Typography, CircularProgress, Alert,
    MenuItem, Select, InputLabel, FormControl, Modal, Box, IconButton, Divider, Stack
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { IMaskInput } from 'react-imask';

// Função auxiliar para converter DD/MM/AAAA para objeto Date
const parseDateString = (dateString) => {
    if (!dateString) return null;
    const [day, month, year] = dateString.split('/').map(Number);
    // Mês é 0-indexado no JavaScript
    return new Date(year, month - 1, day);
};

// Função auxiliar para converter HH:MM para objeto Date (com data arbitrária)
const parseTimeString = (timeString) => {
    if (!timeString) return null;
    const [hours, minutes] = timeString.split(':').map(Number);
    // Usamos uma data arbitrária (e.g., 2000-01-01) apenas para comparar horários
    return new Date(2000, 0, 1, hours, minutes);
};


// --- ATUALIZAÇÃO DO SCHEMA DE VALIDAÇÃO YUP ---
const opportunityValidationSchema = Yup.object().shape({
    titulo: Yup.string().required('O nome da ação é obrigatório'),
    tipo_acao: Yup.string().oneOf(
        ['Educação', 'Saúde', 'Direitos Humanos', 'Meio Ambiente', 'Assistência Social', 'Cultura e Esporte', 'Causa Animal', 'Inclusão Digital', 'Desenvolvimento Comunitário', 'Outros'],
        'Selecione um tipo de ação válido'
    ).required('O tipo de ação é obrigatório'),
    endereco: Yup.string().required('O endereço é obrigatório'),

    data_inicio: Yup.string()
        .matches(
            /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/,
            'Formato da data de início deve ser DD/MM/AAAA'
        )
        .nullable()
        .test(
            'data-inicio-requerida',
            'Data de início é obrigatória se data/hora de término for preenchida.',
            function (value) {
                const { data_termino, hora_inicio, hora_termino } = this.parent;
                // Se qualquer campo de data/hora de término for preenchido, data_inicio é obrigatória
                if ((data_termino || hora_inicio || hora_termino) && !value) {
                    return false;
                }
                return true;
            }
        ),

    data_termino: Yup.string()
        .matches(
            /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/,
            'Formato da data de término deve ser DD/MM/AAAA'
        )
        .nullable()
        .test(
            'data-termino-valida',
            'Data de término não pode ser anterior à data de início.',
            function (value) {
                const { data_inicio } = this.parent;
                if (!value || !data_inicio) { // Se não houver data de término ou início, não valida a ordem
                    return true;
                }
                const inicio = parseDateString(data_inicio);
                const termino = parseDateString(value);
                return termino >= inicio;
            }
        ),

    hora_inicio: Yup.string()
        .matches(
            /^([01]\d|2[0-3]):([0-5]\d)$/,
            'Formato do horário de início deve ser HH:MM (00:00 a 23:59)'
        )
        .nullable()
        .test(
            'hora-inicio-requerida',
            'Horário de início é obrigatório se data/hora de término for preenchida.',
            function (value) {
                const { data_termino, hora_termino } = this.parent;
                // Se data de término ou hora de término for preenchida, hora_inicio é obrigatória
                if ((data_termino || hora_termino) && !value) {
                    return false;
                }
                return true;
            }
        ),
        
    hora_termino: Yup.string()
        .matches(
            /^([01]\d|2[0-3]):([0-5]\d)$/,
            'Formato do horário de término deve ser HH:MM (00:00 a 23:59)'
        )
        .nullable()
        .test(
            'hora-termino-valida',
            'Horário de término não pode ser anterior ao horário de início se as datas são as mesmas.',
            function (value) {
                const { data_inicio, data_termino, hora_inicio } = this.parent;

                if (!value || !hora_inicio) { // Se não houver hora de término ou início, não valida a ordem
                    return true;
                }

                // Se as datas são as mesmas ou a data de início é a única preenchida
                if (data_inicio && data_termino && parseDateString(data_inicio).getTime() === parseDateString(data_termino).getTime()) {
                    const inicio = parseTimeString(hora_inicio);
                    const termino = parseTimeString(value);
                    return termino > inicio; // Must be strictly greater for time on the same day
                }
                // Se as datas são diferentes, o horário de término pode ser qualquer coisa
                // ou se apenas a data de início está preenchida, não validamos a ordem de horário aqui
                return true;
            }
        ),

    perfil_voluntario: Yup.string().nullable(),
    descricao: Yup.string().required('A descrição da oportunidade é obrigatória'),
    ong_nome: Yup.string().required('O nome da ONG é obrigatório'),
    num_vagas: Yup.number().nullable().min(1, 'Mínimo 1 vaga').integer('Deve ser um número inteiro'),
    status_vaga: Yup.string().oneOf(['ativa', 'inativa', 'encerrada', 'em_edicao'], 'Status inválido').required('O status é obrigatório'),
});

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '95%', sm: '60%', md: '500px' },
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
    maxHeight: '95vh',
    overflowY: 'auto',
};

const MaskedInputCustom = React.forwardRef(function MaskedInputCustom(props, ref) {
    const { onChange, mask, ...other } = props;
    return (
        <IMaskInput
            {...other}
            mask={mask}
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
        initialValues: initialValues || {
            titulo: '',
            tipo_acao: '',
            endereco: '',
            data_inicio: '',
            data_termino: '',
            hora_inicio: '',
            hora_termino: '',
            perfil_voluntario: '',
            descricao: '',
            ong_nome: '',
            num_vagas: '',
            status_vaga: 'ativa',
        },
        validationSchema: opportunityValidationSchema,
        onSubmit: (values) => onSubmit(values),
        enableReinitialize: true,
    });

    React.useEffect(() => {
        if (!isOpen) {
            opportunityFormik.resetForm();
        } else if (initialValues && initialValues.id) {
            opportunityFormik.setValues({
                ...initialValues,
                // Garantir que os valores de data/hora sejam strings vazias se null/undefined
                data_inicio: initialValues.data_inicio || '',
                data_termino: initialValues.data_termino || '',
                hora_inicio: initialValues.hora_inicio || '',
                hora_termino: initialValues.hora_termino || '',
            });
        }
    }, [isOpen, initialValues, opportunityFormik.resetForm, opportunityFormik.setValues]);

    return (
        <Modal open={isOpen} onClose={onClose} aria-labelledby="modal-title" aria-describedby="modal-description">
            <Box sx={modalStyle}>
                <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}>
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
                        <Box>
                            <Typography variant="subtitle1" gutterBottom>Identificação da ONG</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <TextField
                                fullWidth
                                label="Nome da ONG"
                                name="ong_nome"
                                value={opportunityFormik.values.ong_nome}
                                onChange={opportunityFormik.handleChange}
                                error={opportunityFormik.touched.ong_nome && Boolean(opportunityFormik.errors.ong_nome)}
                                helperText={opportunityFormik.touched.ong_nome && opportunityFormik.errors.ong_nome}
                            />
                        </Box>

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

                                {/* NOVOS CAMPOS DE DATA INÍCIO E DATA TÉRMINO */}
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    <TextField
                                        fullWidth
                                        label="Data de Início (DD/MM/AAAA)"
                                        name="data_inicio"
                                        value={opportunityFormik.values.data_inicio}
                                        onChange={opportunityFormik.handleChange}
                                        error={opportunityFormik.touched.data_inicio && Boolean(opportunityFormik.errors.data_inicio)}
                                        helperText={opportunityFormik.touched.data_inicio && opportunityFormik.errors.data_inicio}
                                        InputProps={{
                                            inputComponent: MaskedInputCustom,
                                            inputProps: { mask: '00/00/0000' },
                                        }}
                                        sx={{ flex: 1, minWidth: '150px' }}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Data de Término (DD/MM/AAAA)"
                                        name="data_termino"
                                        value={opportunityFormik.values.data_termino}
                                        onChange={opportunityFormik.handleChange}
                                        error={opportunityFormik.touched.data_termino && Boolean(opportunityFormik.errors.data_termino)}
                                        helperText={opportunityFormik.touched.data_termino && opportunityFormik.errors.data_termino}
                                        InputProps={{
                                            inputComponent: MaskedInputCustom,
                                            inputProps: { mask: '00/00/0000' },
                                        }}
                                        sx={{ flex: 1, minWidth: '150px' }}
                                    />
                                </Box>

                                {/* NOVOS CAMPOS DE HORÁRIO INÍCIO E HORÁRIO TÉRMINO */}
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    <TextField
                                        fullWidth
                                        label="Horário de Início (HH:MM)"
                                        name="hora_inicio"
                                        value={opportunityFormik.values.hora_inicio}
                                        onChange={opportunityFormik.handleChange}
                                        error={opportunityFormik.touched.hora_inicio && Boolean(opportunityFormik.errors.hora_inicio)}
                                        helperText={opportunityFormik.touched.hora_inicio && opportunityFormik.errors.hora_inicio}
                                        InputProps={{
                                            inputComponent: MaskedInputCustom,
                                            inputProps: { mask: '00:00' }
                                        }}
                                        sx={{ flex: 1, minWidth: '100px' }}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Horário de Término (HH:MM)"
                                        name="hora_termino"
                                        value={opportunityFormik.values.hora_termino}
                                        onChange={opportunityFormik.handleChange}
                                        error={opportunityFormik.touched.hora_termino && Boolean(opportunityFormik.errors.hora_termino)}
                                        helperText={opportunityFormik.touched.hora_termino && opportunityFormik.errors.hora_termino}
                                        InputProps={{
                                            inputComponent: MaskedInputCustom,
                                            inputProps: { mask: '00:00' }
                                        }}
                                        sx={{ flex: 1, minWidth: '100px' }}
                                    />
                                </Box>

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

                        <Box>
                            <Typography variant="subtitle1" gutterBottom>Detalhes da Vaga</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <TextField
                                    fullWidth
                                    label="Número de Vagas"
                                    name="num_vagas"
                                    type="number"
                                    value={opportunityFormik.values.num_vagas}
                                    onChange={opportunityFormik.handleChange}
                                    error={opportunityFormik.touched.num_vagas && Boolean(opportunityFormik.errors.num_vagas)}
                                    helperText={opportunityFormik.touched.num_vagas && opportunityFormik.errors.num_vagas}
                                    sx={{ flex: 1, minWidth: '150px' }}
                                />
                                <FormControl fullWidth error={opportunityFormik.touched.status_vaga && Boolean(opportunityFormik.errors.status_vaga)} sx={{ flex: 1, minWidth: '150px' }}>
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
                            </Box>
                        </Box>

                        <Stack spacing={2} sx={{ mt: 3 }}>
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
                                    sx={{ width: '100%' }}
                                >
                                    Cancelar Edição
                                </Button>
                            )}
                        </Stack>
                    </Stack>
                </form>
            </Box>
        </Modal>
    );
}