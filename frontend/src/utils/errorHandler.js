export const handleError = (error) => { console.error(error); alert(error.response?.data?.error || error.message); };
