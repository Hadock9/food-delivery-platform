import React, { useEffect, useMemo, useState } from "react";
import { Shield, ShieldOff, Users } from "lucide-react";
import { getAdminUsers, updateAdminUser } from "../api/Admin.jsx";
import "./styles/AdminPanels.css";

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [filters, setFilters] = useState({ query: "", role: "", blocked: "" });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const selectedUser = useMemo(
        () => users.find((user) => user.id === selectedUserId) ?? users[0] ?? null,
        [users, selectedUserId]
    );

    useEffect(() => {
        getAdminUsers({
            query: filters.query || undefined,
            role: filters.role || undefined,
            blocked: filters.blocked || undefined,
        })
            .then((data) => {
                setUsers(Array.isArray(data) ? data : []);
                setSelectedUserId((current) =>
                    current && data.some((user) => user.id === current) ? current : data[0]?.id ?? null
                );
                setError(null);
            })
            .catch((err) => {
                console.error("Failed to load admin users", err);
                setError("Не вдалося завантажити список користувачів.");
            });
    }, [filters.query, filters.role, filters.blocked]);

    const handleSave = async (event) => {
        event.preventDefault();
        if (!selectedUser) return;

        const form = new FormData(event.currentTarget);
        setSaving(true);
        try {
            const updated = await updateAdminUser(selectedUser.id, {
                name: form.get("name"),
                surname: form.get("surname"),
                email: form.get("email"),
                userRole: form.get("userRole"),
                blocked: form.get("blocked") === "on",
            });
            setUsers((current) => current.map((user) => (user.id === updated.id ? updated : user)));
        } catch (err) {
            console.error("Failed to update user", err);
            alert("Не вдалося оновити користувача.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="bh-main admin-panel">
            <header className="bh-top">
                <div>
                    <h1 className="bh-heading">
                        <Users size={24} style={{ marginRight: 10, verticalAlign: "middle" }} />
                        Користувачі
                    </h1>
                    <p className="bh-subheading">Редагування профілів, системної ролі та блокування доступу.</p>
                </div>
            </header>

            <section className="admin-panel-card">
                <div className="admin-toolbar">
                    <input
                        value={filters.query}
                        onChange={(e) => setFilters((current) => ({ ...current, query: e.target.value }))}
                        placeholder="Пошук по email / імені"
                    />
                    <select
                        value={filters.role}
                        onChange={(e) => setFilters((current) => ({ ...current, role: e.target.value }))}
                    >
                        <option value="">Усі ролі</option>
                        <option value="User">User</option>
                        <option value="Admin">Admin</option>
                    </select>
                    <select
                        value={filters.blocked}
                        onChange={(e) => setFilters((current) => ({ ...current, blocked: e.target.value }))}
                    >
                        <option value="">Усі статуси</option>
                        <option value="true">Заблоковані</option>
                        <option value="false">Активні</option>
                    </select>
                </div>
            </section>

            {error && <div className="bh-empty error">{error}</div>}

            <section className="admin-grid-2">
                <div className="admin-panel-card">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Користувач</th>
                                <th>Роль</th>
                                <th>Статус</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr
                                    key={user.id}
                                    onClick={() => setSelectedUserId(user.id)}
                                    style={{
                                        cursor: "pointer",
                                        background:
                                            user.id === selectedUser?.id ? "rgba(124, 92, 255, 0.08)" : "transparent",
                                    }}
                                >
                                    <td>
                                        <strong>{[user.name, user.surname].filter(Boolean).join(" ").trim() || "Без імені"}</strong>
                                        <div className="small-muted">{user.email}</div>
                                    </td>
                                    <td>
                                        <span className="admin-pill">{user.userRole}</span>
                                    </td>
                                    <td>
                                        {user.blocked ? (
                                            <span className="admin-pill danger">
                                                <ShieldOff size={14} /> Заблокований
                                            </span>
                                        ) : (
                                            <span className="admin-pill muted">
                                                <Shield size={14} /> Активний
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="admin-panel-card">
                    {selectedUser ? (
                        <form className="admin-stack" onSubmit={handleSave}>
                            <h3>Редагування користувача</h3>
                            <div className="admin-form-grid">
                                <div>
                                    <label className="small-muted">Імʼя</label>
                                    <input name="name" defaultValue={selectedUser.name} />
                                </div>
                                <div>
                                    <label className="small-muted">Прізвище</label>
                                    <input name="surname" defaultValue={selectedUser.surname} />
                                </div>
                                <div className="full">
                                    <label className="small-muted">Email</label>
                                    <input name="email" defaultValue={selectedUser.email} />
                                </div>
                                <div>
                                    <label className="small-muted">Системна роль</label>
                                    <select name="userRole" defaultValue={selectedUser.userRole}>
                                        <option value="User">User</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>
                                <div style={{ display: "flex", alignItems: "end" }}>
                                    <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                        <input type="checkbox" name="blocked" defaultChecked={selectedUser.blocked} />
                                        Заблокувати доступ
                                    </label>
                                </div>
                            </div>

                            <div>
                                <div className="small-muted">Акаунти</div>
                                <div className="admin-inline-actions" style={{ marginTop: 8 }}>
                                    {selectedUser.accounts.map((account) => (
                                        <span key={account.id} className="admin-pill muted">
                                            {account.accountType}: {account.name || account.id.slice(0, 6)}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="admin-inline-actions">
                                <button type="submit" className="primary" disabled={saving}>
                                    {saving ? "Збереження..." : "Зберегти"}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="bh-empty">Користувача не вибрано.</div>
                    )}
                </div>
            </section>
        </main>
    );
}
