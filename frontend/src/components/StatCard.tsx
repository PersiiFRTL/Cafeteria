interface StatCardProps {
    titulo: string;
    valor: string;
    icono: string;
}

function StatCard({ titulo, valor, icono }: StatCardProps) {
    return (
        <div className="stat-card">
            <div className="stat-icon">
                {icono}
            </div>

            <div>
                <p>{titulo}</p>
                <h2>{valor}</h2>
            </div>
        </div>
    );
}

export default StatCard;