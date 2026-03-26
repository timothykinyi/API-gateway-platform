import { removeServer, updateServer } from "../api/orgApi";
import { useState } from "react";

export default function ServerList({ org }) {
  const [editingServer, setEditingServer] = useState(null);
  const [newUrl, setNewUrl] = useState("");

  const handleDelete = async (serverId) => {
    await removeServer(org._id, serverId);
    window.location.reload(); // simple refresh for now
  };

  const handleEdit = (server) => {
    setEditingServer(server._id);
    setNewUrl(server.url);
  };

  const handleUpdate = async () => {
    await updateServer(org._id, editingServer, { url: newUrl });
    setEditingServer(null);
    window.location.reload();
  };

  return (
    <ul>
      {org.servers.map((server) => (
        <li key={server._id}>
          {editingServer === server._id ? (
            <>
              <input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
              <button onClick={handleUpdate}>Save</button>
            </>
          ) : (
            <>
              {server.url} ({server.status})
              <button onClick={() => handleEdit(server)}>Edit</button>
              <button onClick={() => handleDelete(server._id)}>Delete</button>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}