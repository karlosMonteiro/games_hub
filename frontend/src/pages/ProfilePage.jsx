export default function ProfilePage() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  return (
    <div className="container">
      <h3>Perfil</h3>
      {user ? (
        <div className="card">
          <div className="card-body">
            <p><strong>Nome:</strong> {user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>CPF:</strong> {user.cpf}</p>
            <p><strong>Telefone:</strong> {user.phone}</p>
          </div>
        </div>
      ) : (
        <p>Carregando...</p>
      )}
    </div>
  );
}
