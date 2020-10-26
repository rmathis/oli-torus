defmodule OliWeb.Pow.PowHelpers do

  alias PowAssent.Plug

  alias Phoenix.{HTML, HTML.Link, Naming}
  alias PowAssent.Phoenix.AuthorizationController

  def get_pow_config(:user) do
    [
      repo: Oli.Repo,
      user: Oli.Accounts.User,
      current_user_assigns_key: :current_user,
      session_key: "user_auth",
      routes_backend: OliWeb.Pow.UserRoutes,
      plug: Pow.Plug.Session
    ]
  end

  def get_pow_config(:author) do
    Application.fetch_env!(:oli, :pow)
  end

  def use_pow_config(conn, :user) do
    Pow.Plug.put_config(conn, get_pow_config(:user))
  end

  def use_pow_config(conn, :author) do
    Pow.Plug.put_config(conn, get_pow_config(:author))
  end

  @doc """
  Generates list of authorization links for all configured providers.
  The list of providers will be fetched from the PowAssent configuration, and
  `authorization_link/2` will be called on each.
  If a user is assigned to the conn, the authorized providers for a user will
  be looked up with `PowAssent.Plug.providers_for_current_user/1`.
  `deauthorization_link/2` will be used for any already authorized providers.
  """
  def provider_links(conn, link_params \\ [], link_opts \\ []) do
    available_providers = Plug.available_providers(conn)
    providers_for_user  = Plug.providers_for_current_user(conn)

    available_providers
    |> Enum.map(&{&1, &1 in providers_for_user})
    |> Enum.map(fn
      {provider, false} -> authorization_link(conn, provider, link_params, link_opts)
    end)
  end

  @doc """
  Generates an authorization link for a provider.
  The link is used to sign up or register a user using a provider. If
  `:invited_user` is assigned to the conn, the invitation token will be passed
  on through the URL query params.
  """
  def authorization_link(conn, provider, link_params \\ [], opts \\ []) do
    query_params = invitation_token_query_params(conn) ++ request_path_query_params(conn)

    provider_classname = provider
      |> Naming.humanize
      |> String.downcase

    msg  = AuthorizationController.extension_messages(conn).login_with_provider(%{conn | params: %{"provider" => provider}})
    icon = HTML.raw("<i class=\"fab #{provider_icon(provider)} fa-lg mr-2\"></i>")

    path = AuthorizationController.routes(conn).path_for(conn, AuthorizationController, :new, [provider], query_params)
    path = case link_params do
      [] -> path
      link_params ->
        Enum.reduce(link_params, "#{path}?", fn {key, val}, acc -> acc <> "#{key}=#{val}&" end)
        |> String.trim("&")
    end
    opts = Keyword.merge(opts, to: path)
    opts = Keyword.merge(opts, class: "btn btn-md btn-#{provider_classname} btn-block social-signin")

    Link.link([icon, msg], opts)
  end

  defp invitation_token_query_params(%{assigns: %{invited_user: %{invitation_token: token}}}), do: [invitation_token: token]
  defp invitation_token_query_params(_conn), do: []

  defp request_path_query_params(%{assigns: %{request_path: request_path}}), do: [request_path: request_path]
  defp request_path_query_params(_conn), do: []

  defp provider_icon(provider) do
    case provider do
      :google -> "fa-google"
      :facebook -> "fa-facebook-f"
      _ -> ""
    end
  end
end
