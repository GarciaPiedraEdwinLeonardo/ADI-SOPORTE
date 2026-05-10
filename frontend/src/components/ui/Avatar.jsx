export default function Avatar({ user, size = 44 }) {
    const initials = [user.name?.[0], user.apat?.[0]]
        .filter(Boolean)
        .join('')
        .toUpperCase() || '?'

    // Color determinista basado en el id
    const hue = ((user.id ?? 0) * 47) % 360
    const style = {
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `hsl(${hue}deg 55% 88%)`,
        color: `hsl(${hue}deg 55% 30%)`,
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        flexShrink: 0
    }

    return (
        <div style={style}>
            {initials}
        </div>
    )
}
