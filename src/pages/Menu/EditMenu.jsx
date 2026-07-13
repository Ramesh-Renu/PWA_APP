const EditMenu = () => {
    const handleSubmit = async (formData) => {
        await updateMenu(menuId, formData);
    };

    return (
        <MenuForm
            initialValues={menu}
            onSubmit={handleSubmit}
            isEdit
        />
    );
};

export default EditMenu;