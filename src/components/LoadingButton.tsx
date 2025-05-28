import { Button, ButtonProps, CircularProgress } from '@mui/material';

interface LoadingButtonProps extends ButtonProps {
    loading: boolean;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
    children,
    loading,
    disabled,
    ...props
}) => {
    return (
        <Button
            {...props}
            disabled={loading || disabled}
            sx={{
                position: 'relative',
                ...props.sx
            }}
        >
            {children}
            {loading && (
                <CircularProgress
                    size={24}
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        marginTop: '-12px',
                        marginLeft: '-12px'
                    }}
                />
            )}
        </Button>
    );
};
