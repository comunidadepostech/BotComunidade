/* eslint-disable @typescript-eslint/explicit-function-return-type */
export default () => ({
    "/api/v2/vacancy": {
        POST: (req: Request) => {
            console.debug(req);
            return Response.json({});
        },
    },
});