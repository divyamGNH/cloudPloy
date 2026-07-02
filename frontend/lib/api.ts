const API="http://localhost:5000";

async function request(path: string, init?: RequestInit) {
    return fetch(`${API}${path}`, {
        credentials : "include",
        headers : {
            "Content-Type" : "application/json",
            ...init?.headers
        },
        ...init
    });
}

export const api = { 
    get : (path : string) => request(path),

    post : (path: string, body : unknown) => request(path, {
        method : "POST",
        body : JSON.stringify(body),
    }),
}