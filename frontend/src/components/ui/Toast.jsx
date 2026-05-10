import { MdCheckCircle, MdCancel } from 'react-icons/md'
import styles from './Toast.module.css'

export default function Toast({ msg, type = 'success' }) {
    if (!msg) return null

    return (
        <div className={`${styles.toast} ${type === 'error' ? styles.toastError : styles.toastSuccess}`}>
            {type === 'error' ? <MdCancel size={17} /> : <MdCheckCircle size={17} />}
            {msg}
        </div>
    )
}
