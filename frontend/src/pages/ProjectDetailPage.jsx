import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext';
import { format, parseISO, isPast } from 'date-fns';
import { Plus, ArrowLeft, Users, Trash2, Edit2, UserPlus, X, ChevronDown } from 'lucide-react';

function StatusBadge({ status }) {
    const labels = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };
    return <span className={`badge badge-${status}`}>{labels[status] || status}</span>;
}
function PriorityBadge({ priority }) {
    return <span className={`badge badge-${priority}`}>{priority}</span>;
}

function TaskModal({ task, project, members, onClose, onSave }) {
    const { user } = useAuth();
    const isEdit = !!task;
    const [form, setForm] = useState({
        title: task?.title || '',
        description: task?.description || '',
        assigneeId: task?.assigneeId || '',
        status: task?.status || 'todo',
        priority: task?.priority || 'medium',
        dueDate: task?.dueDate ? task.dueDate.substring(0, 10) : '',
        projectId: project._id
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) return setError('Title required');
        setLoading(true);
        try {
            const payload = { ...form, dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null };
            let res;
            if (isEdit) {
                res = await api.put(`/tasks/${task._id}`, payload);
            } else {
                res = await api.post('/tasks', payload);
            }
            onSave(res.data, isEdit);
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save task');
        } finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <h2 className="modal-title">{isEdit ? 'Edit Task' : 'New Task'}</h2>
                {error && <div className="alert alert-error">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Title *</label>
                        <input className="form-input" placeholder="Task title"
                            value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea className="form-textarea" placeholder="Task details..."
                            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                <option value="todo">To Do</option>
                                <option value="in_progress">In Progress</option>
                                <option value="review">Review</option>
                                <option value="done">Done</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Priority</label>
                            <select className="form-select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label className="form-label">Assignee</label>
                            <select className="form-select" value={form.assigneeId} onChange={e => setForm({ ...form, assigneeId: e.target.value })}>
                                <option value="">Unassigned</option>
                                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Due Date</label>
                            <input className="form-input" type="date" value={form.dueDate}
                                onChange={e => setForm({ ...form, dueDate: e.target.value })} />
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Task')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function AddMemberModal({ projectId, onClose, onAdd }) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('member');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post(`/projects/${projectId}/members`, { email, role });
            onAdd(res.data);
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to add member');
        } finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal" style={{ maxWidth: 400 }}>
                <h2 className="modal-title">Add Team Member</h2>
                {error && <div className="alert alert-error">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input className="form-input" type="email" placeholder="colleague@example.com"
                            value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Role</label>
                        <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Adding...' : 'Add Member'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const KANBAN_COLS = [
    { key: 'todo', label: 'To Do', color: 'var(--bg-3)' },
    { key: 'in_progress', label: 'In Progress', color: 'rgba(59,130,246,0.08)' },
    { key: 'review', label: 'Review', color: 'rgba(234,179,8,0.08)' },
    { key: 'done', label: 'Done', color: 'rgba(34,197,94,0.08)' },
];

export default function ProjectDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('kanban');
    const [taskModal, setTaskModal] = useState(null); // null | 'new' | task obj
    const [showAddMember, setShowAddMember] = useState(false);
    const [error, setError] = useState('');

    const isAdmin = project?.userRole === 'admin' || user?.role === 'admin';

    const loadProject = () => api.get(`/projects/${id}`).then(res => setProject(res.data));
    const loadTasks = () => api.get(`/tasks/project/${id}`).then(res => setTasks(res.data));

    useEffect(() => {
        Promise.all([loadProject(), loadTasks()]).finally(() => setLoading(false));
    }, [id]);

    const handleTaskSave = (task, isEdit) => {
        if (isEdit) setTasks(t => t.map(x => x._id === task._id ? task : x));
        else setTasks(t => [task, ...t]);
    };

    const handleStatusChange = async (taskId, status) => {
        try {
            const res = await api.put(`/tasks/${taskId}`, { status });
            setTasks(t => t.map(x => x._id === taskId ? { ...x, ...res.data } : x));
        } catch (err) { setError(err.response?.data?.error || 'Failed to update'); }
    };

    const handleDeleteTask = async (taskId) => {
        if (!confirm('Delete this task?')) return;
        await api.delete(`/tasks/${taskId}`);
        setTasks(t => t.filter(x => x._id !== taskId));
    };

    const handleRemoveMember = async (userId) => {
        if (!confirm('Remove this member?')) return;
        await api.delete(`/projects/${id}/members/${userId}`);
        setProject(p => ({ ...p, members: p.members.filter(m => m.id !== userId) }));
    };

    if (loading) return <div className="loading"><div className="spinner" /> Loading project...</div>;
    if (!project) return <div className="page"><p>Project not found</p></div>;

    const members = project.members || [];

    return (
        <div className="page">
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')} style={{ marginBottom: 12 }}>
                    <ArrowLeft size={14} /> Back to Projects
                </button>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: project.color, flexShrink: 0 }} />
                        <h1 className="page-title">{project.name}</h1>
                        <span className={`badge badge-${project.userRole}`}>{project.userRole}</span>
                    </div>
                    {isAdmin && (
                        <button className="btn btn-primary btn-sm" onClick={() => setTaskModal('new')}>
                            <Plus size={14} /> Add Task
                        </button>
                    )}
                </div>
                {project.description && <p className="page-subtitle" style={{ marginTop: 6 }}>{project.description}</p>}
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {/* Tabs */}
            <div className="tabs">
                <button className={`tab ${tab === 'kanban' ? 'active' : ''}`} onClick={() => setTab('kanban')}>
                    Board
                </button>
                <button className={`tab ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')}>
                    List ({tasks.length})
                </button>
                <button className={`tab ${tab === 'members' ? 'active' : ''}`} onClick={() => setTab('members')}>
                    <Users size={13} style={{ marginRight: 4, verticalAlign: -2 }} />
                    Members ({members.length})
                </button>
            </div>

            {/* Kanban Board */}
            {tab === 'kanban' && (
                <div className="kanban-board">
                    {KANBAN_COLS.map(col => {
                        const colTasks = tasks.filter(t => t.status === col.key);
                        return (
                            <div key={col.key} className="kanban-col">
                                <div className="kanban-col-header" style={{ background: col.color }}>
                                    <span className="kanban-col-title">{col.label}</span>
                                    <span className="kanban-count">{colTasks.length}</span>
                                </div>
                                {colTasks.map(task => (
                                    <div key={task._id} className="kanban-task">
                                        <div className="kanban-task-title">{task.title}</div>
                                        <div className="kanban-task-meta">
                                            <PriorityBadge priority={task.priority} />
                                            <div className="flex gap-2 items-center">
                                                {task.dueDate && (
                                                    <span style={{ fontSize: 11, color: isPast(parseISO(task.dueDate)) && task.status !== 'done' ? 'var(--red)' : 'var(--text-3)' }}>
                                                        {format(parseISO(task.dueDate), 'MMM d')}
                                                    </span>
                                                )}
                                                {task.assigneeName && (
                                                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--bg-4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: 'var(--text-2)' }}>
                                                        {task.assigneeName[0]}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {isAdmin && (
                                            <div className="flex gap-2" style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                                                <select style={{ flex: 1, background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-2)', fontSize: 11, padding: '3px 6px', cursor: 'pointer' }}
                                                    value={task.status} onChange={e => handleStatusChange(task._id, e.target.value)}>
                                                    <option value="todo">To Do</option>
                                                    <option value="in_progress">In Progress</option>
                                                    <option value="review">Review</option>
                                                    <option value="done">Done</option>
                                                </select>
                                                <button className="btn btn-ghost" style={{ padding: '3px 7px' }} onClick={() => setTaskModal(task)}><Edit2 size={12} /></button>
                                                <button className="btn btn-ghost" style={{ padding: '3px 7px' }} onClick={() => handleDeleteTask(task._id)}><Trash2 size={12} color="var(--red)" /></button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {!isAdmin && colTasks.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--text-3)', fontSize: 13 }}>No tasks</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* List view */}
            {tab === 'list' && (
                <div>
                    {tasks.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">✅</div>
                            <h3>No tasks yet</h3>
                            <p>Add your first task to get started</p>
                            {isAdmin && <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setTaskModal('new')}><Plus size={14} /> Add Task</button>}
                        </div>
                    ) : (
                        <div className="task-list">
                            {tasks.map(task => {
                                const isOverdue = task.dueDate && isPast(parseISO(task.dueDate)) && task.status !== 'done';
                                return (
                                    <div key={task._id} className="task-item">
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div className="flex items-center gap-2">
                                                <span className={`task-title ${task.status === 'done' ? 'done' : ''}`}>{task.title}</span>
                                            </div>
                                            {task.description && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.description}</div>}
                                        </div>
                                        <div className="task-meta">
                                            <PriorityBadge priority={task.priority} />
                                            <StatusBadge status={task.status} />
                                            {task.assigneeName && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>→ {task.assigneeName}</span>}
                                            {task.dueDate && <span className={`task-due ${isOverdue ? 'overdue' : ''}`}>{format(parseISO(task.dueDate), 'MMM d')}</span>}
                                            {isAdmin && <>
                                                <button className="btn btn-ghost btn-sm" style={{ padding: '3px 7px' }} onClick={() => setTaskModal(task)}><Edit2 size={13} /></button>
                                                <button className="btn btn-ghost btn-sm" style={{ padding: '3px 7px' }} onClick={() => handleDeleteTask(task._id)}><Trash2 size={13} color="var(--red)" /></button>
                                            </>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Members tab */}
            {tab === 'members' && (
                <div>
                    <div className="flex items-center justify-between mb-4" style={{ marginBottom: 16 }}>
                        <span style={{ color: 'var(--text-2)', fontSize: 14 }}>{members.length} team member{members.length !== 1 ? 's' : ''}</span>
                        {isAdmin && (
                            <button className="btn btn-primary btn-sm" onClick={() => setShowAddMember(true)}>
                                <UserPlus size={14} /> Add Member
                            </button>
                        )}
                    </div>
                    <div className="card">
                        {members.map(m => (
                            <div key={m.id} className="member-item">
                                <div className="member-avatar">{m.name?.[0]?.toUpperCase() || '?'}</div>
                                <div style={{ flex: 1 }}>
                                    <div className="member-name">{m.name}</div>
                                    <div className="member-email">{m.email}</div>
                                </div>
                                <span className={`badge badge-${m.role}`}>{m.role}</span>
                                {isAdmin && m.id !== user.id && (
                                    <button className="btn btn-ghost btn-sm" onClick={() => handleRemoveMember(m.id)}>
                                        <X size={13} color="var(--red)" />
                                    </button>
                                )}
                            </div>
                        ))}
                        {members.length === 0 && <p style={{ color: 'var(--text-3)', fontSize: 14 }}>No members yet</p>}
                    </div>
                </div>
            )}

            {/* Modals */}
            {(taskModal === 'new' || (taskModal && taskModal !== 'new')) && (
                <TaskModal
                    task={taskModal === 'new' ? null : taskModal}
                    project={project}
                    members={members}
                    onClose={() => setTaskModal(null)}
                    onSave={handleTaskSave}
                />
            )}
            {showAddMember && (
                <AddMemberModal
                    projectId={id}
                    onClose={() => setShowAddMember(false)}
                    onAdd={(m) => setProject(p => ({ ...p, members: [...p.members, m] }))}
                />
            )}
        </div>
    );
}