exports.generateQrCode = async (req, res) => {
    const configutationId = req.params.configutationId;
    const { size = 744, deviceId = '', useId = '' } = req.query;
}