defmodule Oli.Plugs.RequireIndependentInstructor do
  import Plug.Conn
  alias Oli.Delivery.Sections

  def init(opts), do: opts

  def call(conn, _opts) do

    IO.inspect(Sections.is_independent_instructor?(Pow.Plug.current_user(conn)), label: "User can create sections")

    if Sections.is_independent_instructor?(Pow.Plug.current_user(conn)) do
      conn
    else
      conn
      |> resp(403, "Forbidden")
      |> halt()
    end
  end
end
