"use client";
import { signOut, useSession } from "next-auth/react";
import React from "react";

function Settings() {
  const session = useSession();
  console.log(session);

  const onClick = () => {
    signOut();
  };
  return (
    <div>
      {JSON.stringify(session?.data?.user)}
      <button onClick={onClick}>SIgnOut</button>
    </div>
  );
}

export default Settings;
