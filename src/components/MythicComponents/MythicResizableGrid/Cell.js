import useStyles from './styles';

const Cell = ({ VariableSizeGridProps: { style, rowIndex, columnIndex, data, ...other } }) => {
    const classes = useStyles();

    const item = data[rowIndex][columnIndex];

    return (
        <div style={style} className={classes.cell}>
            <div className={classes.cellInner}>{item}</div>
        </div>
    );
};

export default Cell;
