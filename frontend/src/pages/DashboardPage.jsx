import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { format, parseISO } from 'date-fns';
import { AlertTriangle, CheckCircle2, ListTodo, Clock, TrendingUp } from 'lucide-react';

function StatusBadge({ status }) {
    const labels = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };
    return <span className={`badge badge-${status}`}>{labels[status] || status}</span>;
}

function PriorityBadge({ priority }) {
    return <span className={`badge badge-${priority}`}>{priority}</span>;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/tasks/dashboard').then(res => setData(res.data)).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading"><div className="spinner" /> Loading dashboard...</div>;

    const { stats = {}, recentTasks = [], overdueTasks = [] } = data || {};

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
                <p className="page-subtitle">Here's what's happening across your projects</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon"><ListTodo size={20} color="var(--accent)" /></div>
                    <div className="stat-value">{stats.total ?? 0}</div>
                    <div className="stat-label">Total Tasks</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon"><Clock size={20} color="var(--blue)" /></div>
                    <div className="stat-value">{stats.myTasks ?? 0}</div>
                    <div className="stat-label">Assigned to Me</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon"><CheckCircle2 size={20} color="var(--green)" /></div>
                    <div className="stat-value">{stats.byStatus?.done ?? 0}</div>
                    <div className="stat-label">Completed</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon"><AlertTriangle size={20} color="var(--red)" /></div>
                    <div className="stat-value" style={{ color: stats.overdue > 0 ? 'var(--red)' : undefined }}>
                        {stats.overdue ?? 0}
                    </div>
                    <div className="stat-label">Overdue</div>
                </div>
            </div>

            {/* Status breakdown */}
            <div className="card mb-4" style={{ marginBottom: 16 }}>
                <div className="flex items-center gap-2 mb-4" style={{ marginBottom: 16 }}>
                    <TrendingUp size={16} color="var(--accent)" />
                    <span style={{ fontWeight: 600, fontSize: 15 }}>Task Status Breakdown</span>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {[
                        { key: 'todo', label: 'To Do', color: 'var(--text-3)' },
                        { key: 'in_progress', label: 'In Progress', color: 'var(--blue)' },
                        { key: 'review', label: 'Review', color: 'var(--yellow)' },
                        { key: 'done', label: 'Done', color: 'var(--green)' },
                    ].map(({ key, label, color }) => (
                        <div key={key} style={{ flex: 1, minWidth: 100, background: 'var(--bg-3)', borderRadius: 8, padding: '12px 14px' }}>
                            <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: 'var(--font-display)' }}>{stats.byStatus?.[key] ?? 0}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{label}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Recent tasks */}
                <div className="card">
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Recent Activity</h3>
                    {recentTasks.length === 0 ? (
                        <div className="empty-state" style={{ padding: '24px 0' }}>
                            <p>No tasks yet</p>
                        </div>
                    ) : (
                        <div className="task-list">
                            {recentTasks.map(task => (
                                <div key={task._id} className="task-item" style={{ cursor: 'pointer' }}
                                    onClick={() => navigate(`/projects/${task.projectId}`)}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className="task-title truncate">{task.title}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{task.projectName}</div>
                                    </div>
                                    <div className="task-meta">
                                        <StatusBadge status={task.status} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Overdue tasks */}
                <div className="card">
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, marginBottom: 16, color: overdueTasks.length > 0 ? 'var(--red)' : undefined }}>
                        {overdueTasks.length > 0 ? <><AlertTriangle size={16} style={{ marginRight: 6, verticalAlign: -3 }} />Overdue Tasks</> : 'Overdue Tasks'}
                    </h3>
                    {overdueTasks.length === 0 ? (
                        <div className="empty-state" style={{ padding: '24px 0' }}>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                            <p>All caught up! No overdue tasks.</p>
                        </div>
                    ) : (
                        <div className="task-list">
                            {overdueTasks.map(task => (
                                <div key={task._id} className="task-item" style={{ borderColor: 'rgba(239,68,68,0.2)', cursor: 'pointer' }}
                                    onClick={() => navigate(`/projects/${task.projectId}`)}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className="task-title truncate">{task.title}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{task.projectName}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--red)' }}>
                                            {task.dueDate ? format(parseISO(task.dueDate), 'MMM d') : ''}
                                        </div>
                                        <PriorityBadge priority={task.priority} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
}