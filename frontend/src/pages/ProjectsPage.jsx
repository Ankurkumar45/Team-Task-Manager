import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api.js';
import { Plus, Users, CheckSquare, AlertTriangle, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6'];

function CreateProjectModal({ onClose, onCreate }) {
    const [form, setForm] = useState({ name: '', description: '', color: COLORS[0] });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) return setError('Project name is required');
        setLoading(true);
        try {
            const res = await api.post('/projects', form);
            onCreate(res.data);
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create project');
        } finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <h2 className="modal-title">New Project</h2>
                {error && <div className="alert alert-error">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Project Name *</label>
                        <input className="form-input" placeholder="e.g. Website Redesign"
                            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea className="form-textarea" placeholder="What is this project about?"
                            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Color</label>
                        <div className="color-options">
                            {COLORS.map(c => (
                                <div key={c} className={`color-option ${form.color === c ? 'selected' : ''}`}
                                    style={{ background: c }} onClick={() => setForm({ ...form, color: c })} />
                            ))}
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ProjectsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);

    useEffect(() => {
        api.get('/projects').then(res => setProjects(res.data)).finally(() => setLoading(false));
    }, []);

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!confirm('Delete this project and all its tasks?')) return;
        await api.delete(`/projects/${id}`);
        setProjects(p => p.filter(x => x._id !== id));
    };

    if (loading) return <div className="loading"><div className="spinner" /> Loading projects...</div>;

    return (
        <div className="page">
            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="page-title">Projects</h1>
                    <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                    <Plus size={16} /> New Project
                </button>
            </div>

            {projects.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📁</div>
                    <h3>No projects yet</h3>
                    <p>Create your first project to get started</p>
                    <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreate(true)}>
                        <Plus size={16} /> Create Project
                    </button>
                </div>
            ) : (
                <div className="projects-grid">
                    {projects.map(project => {
                        const progress = project.totalTasks > 0
                            ? Math.round((project.doneTasks / project.totalTasks) * 100) : 0;
                        return (
                            <div key={project._id} className="card card-hover" onClick={() => navigate(`/projects/${project._id}`)}>
                                <div className="project-color-bar" style={{ background: project.color }} />
                                <div className="flex items-center justify-between mb-2" style={{ marginBottom: 6 }}>
                                    <h3 className="project-name">{project.name}</h3>
                                    <div className="flex gap-2 items-center">
                                        <span className={`badge badge-${project.userRole}`}>{project.userRole}</span>
                                        {project.userRole === 'admin' && (
                                            <button className="btn btn-ghost" style={{ padding: '3px 6px' }}
                                                onClick={(e) => handleDelete(e, project._id)}>
                                                <Trash2 size={13} color="var(--red)" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className="project-desc">{project.description || 'No description'}</p>
                                <div className="project-meta">
                                    <div className="project-meta-item"><CheckSquare size={12} /> {project.totalTasks} tasks</div>
                                    <div className="project-meta-item"><Users size={12} /> {project.memberCount} members</div>
                                    {project.overdueTasks > 0 && (
                                        <div className="project-meta-item" style={{ color: 'var(--red)' }}>
                                            <AlertTriangle size={12} /> {project.overdueTasks} overdue
                                        </div>
                                    )}
                                </div>
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
                                    {progress}% complete — {project.doneTasks}/{project.totalTasks} done
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showCreate && (
                <CreateProjectModal
                    onClose={() => setShowCreate(false)}
                    onCreate={p => setProjects(prev => [p, ...prev])}
                />
            )}
        </div>
    );
}